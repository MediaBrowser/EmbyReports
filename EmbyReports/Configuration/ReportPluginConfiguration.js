define(['baseView', 'jQuery', 'loading', 'appRouter', 'emby-linkbutton', 'paper-icon-button-light', 'emby-scroller'], function (BaseView, $, loading, appRouter) {
    'use strict';

    var defaultSortBy = "SortName";
    var topItems = 5;

    var query = {
        StartIndex: 0,
        Limit: 100,
        IncludeItemTypes: "Movie",
        HasQueryLimit: true,
        GroupBy: "None",
        ReportView: "ReportData",
        DisplayType: "Screen",
    };

    function getTable(result, initial_state) {
        var html = '';
        //Report table
        html += '<table id="tblReport" data-role="table" data-mode="reflow" class="tblLibraryReport stripedTable ui-responsive table-stroke detailTable" style="display:table;">';
        html += '<thead>';

        //Report headers
        result.Headers.map(function (header) {
            var cellHtml = '<th class="detailTableHeaderCell" data-priority="' + 'persist' + '">';

            if (header.ShowHeaderLabel) {
                if (header.SortField) {
                    cellHtml += '<a class="lnkColumnSort button-link" is="emby-linkbutton" href="#" data-sortfield="' + header.SortField + '" style="text-decoration:underline;">';
                }

                cellHtml += (header.Name || '&nbsp;');
                if (header.SortField) {
                    cellHtml += '</a>';
                    if (header.SortField === query.SortBy) {

                        if (query.SortOrder === "Descending") {
                            cellHtml += '<span style="font-weight:bold;margin-left:5px;vertical-align:top;">&darr;</span>';
                        } else {
                            cellHtml += '<span style="font-weight:bold;margin-left:5px;vertical-align:top;">&uarr;</span>';
                        }
                    }
                }
            }
            cellHtml += '</th>';
            html += cellHtml;
        });

        html += '</thead>';
        //Report body
        html += '<tbody>';
        if (result.IsGrouped === false) {

            result.Rows.map(function (row) {
                html += getRow(result.Headers, row);
            });
        }
        else {
            var row_count = 0;
            var current_state = "table-row";
            var current_pointer = "&#x25BC;";
            if (initial_state == true) {
                current_state = "none";
                current_pointer = "&#x25B6;";
            }
            result.Groups.map(function (group) {
                html += '<tr style="background-color: rgb(51, 51, 51); color: rgba(255,255,255,.87);">';
                html += '<th class="detailTableHeaderCell" scope="rowgroup" colspan="' + result.Headers.length + '">';
                html += '<a class="lnkShowHideRows" data-group_id="' + row_count + '" data-group_state="' + current_state + '" style="cursor: pointer;">' + current_pointer + '</a> ';
                html += (group.Name || '&nbsp;') + ' : ' + group.Rows.length;
                html += '</th>';
                html += '</tr>';
                group.Rows.map(function (row) {
                    html += getRow(result.Headers, row, row_count, current_state);
                });
                html += '<tr>';
                html += '<th class="detailTableHeaderCell row_id_' + row_count + '" scope="rowgroup" colspan="' + result.Headers.length + '" style="display:' + current_state + ';">&nbsp;</th>';
                html += '</tr>';
                row_count++;
            });
        }

        html += '</tbody>';
        html += '</table>';
        return html;
    }

    function getRow(rHeaders, rRow, row_count, current_state) {
        var html = '';
        html += '<tr class="detailTableBodyRow detailTableBodyRow-shaded row_id_' + row_count + '" style="display:' + current_state + ';">';

        for (var j = 0; j < rHeaders.length; j++) {
            var rHeader = rHeaders[j];
            var rItem = rRow.Columns[j];
            html += getItem(rHeader, rRow, rItem);
        }
        html += '</tr>';
        return html;
    }

    function getItem(rHeader, rRow, rItem) {
        var html = '';
        html += '<td class="detailTableBodyCell">';
        var id = rRow.Id;
        if (rItem.Id)
            id = rItem.Id;
        var serverId = rRow.ServerId || rItem.ServerId || ApiClient.serverId();

        switch (rHeader.ItemViewType) {
            case "None":
                html += rItem.Name;
                break;
            case "Detail":
                html += '<a is="emby-linkbutton" class="button-link" href="' + appRouter.getRouteUrl({ Id: id, ServerId: serverId }) + '">' + rItem.Name + '</a>';
                break;
            case "Edit":
                html += '<a is="emby-linkbutton" class="button-link" href="edititemmetadata.html?id=' + rRow.Id + '">' + rItem.Name + '</a>';
                break;
            case "List":
                html += '<a is="emby-linkbutton" class="button-link" href="itemlist.html?serverId=' + rItem.ServerId + '&id=' + rRow.Id + '">' + rItem.Name + '</a>';
                break;
            case "ItemByNameDetails":
                html += '<a is="emby-linkbutton" class="button-link" href="' + appRouter.getRouteUrl({ Id: id, ServerId: serverId }) + '">' + rItem.Name + '</a>';
                break;
            case "EmbeddedImage":
                if (rRow.HasEmbeddedImage) {
                    html += '<i class="md-icon">check</i>';
                }
                break;
            case "SubtitleImage":
                if (rRow.HasSubtitles) {
                    html += '<i class="md-icon">check</i>';
                }
                break;
            case "TrailersImage":
                if (rRow.HasLocalTrailer) {
                    html += '<i class="md-icon">check</i>';
                }
                break;
            case "SpecialsImage":
                if (rRow.HasSpecials) {
                    html += '<i class="md-icon" title="Missing primary image." style="color:red;">photo</i>';
                }
                break;
            case "LockDataImage":
                if (rRow.HasLockData) {
                    html += '<i class="md-icon">lock</i>';
                }
                break;
            case "TagsPrimaryImage":
                if (!rRow.HasImageTagsPrimary) {
                    html += '<a is="emby-linkbutton" class="button-link" href="edititemmetadata.html?id=' + rRow.Id + '"><i class="md-icon" title="Missing primary image." style="color:red;">photo</i></a>';
                }
                break;
            case "TagsBackdropImage":
                if (!rRow.HasImageTagsBackdrop) {
                    if (rRow.RowType !== "Episode" && rRow.RowType !== "Season" && rRow.MediaType !== "Audio" && rRow.RowType !== "TvChannel" && rRow.RowType !== "MusicAlbum") {
                        html += '<a is="emby-linkbutton" class="button-link" href="edititemmetadata.html?id=' + rRow.Id + '"><i class="md-icon" title="Missing backdrop image." style="color:orange;">photo</i></a>';
                    }
                }
                break;
            case "TagsLogoImage":
                if (!rRow.HasImageTagsLogo) {
                    if (rRow.RowType === "Movie" || rRow.RowType === "Trailer" || rRow.RowType === "Series" || rRow.RowType === "MusicArtist" || rRow.RowType === "BoxSet") {
                        html += '<a is="emby-linkbutton" class="button-link" href="edititemmetadata.html?id=' + rRow.Id + '"><i class="md-icon" title="Missing logo image.">photo</i></a>';
                    }
                }
                break;
            case "UserPrimaryImage":
                if (rRow.UserId) {
                    var userImage = ApiClient.getUserImageUrl(rRow.UserId, {
                        height: 24,
                        type: 'Primary'

                    });
                    if (userImage) {
                        html += '<img src="' + userImage + '" />';
                    } else {
                        html += '';
                    }
                }
                break;
            case "StatusImage":
                if (rRow.HasLockData) {
                    html += '<i class="md-icon">lock</i>';
                }

                if (!rRow.HasLocalTrailer && rRow.RowType === "Movie") {
                    html += '<i title="Missing local trailer." class="md-icon">videocam</i>';
                }

                if (!rRow.HasImageTagsPrimary) {
                    html += '<i class="md-icon" title="Missing primary image." style="color:red;">photo</i>';
                }

                if (!rRow.HasImageTagsBackdrop) {
                    if (rRow.RowType !== "Episode" && rRow.RowType !== "Season" && rRow.MediaType !== "Audio" && rRow.RowType !== "TvChannel" && rRow.RowType !== "MusicAlbum") {
                        html += '<i class="md-icon" title="Missing backdrop image." style="color:orange;">photo</i>';
                    }
                }

                if (!rRow.HasImageTagsLogo) {
                    if (rRow.RowType === "Movie" || rRow.RowType === "Trailer" || rRow.RowType === "Series" || rRow.RowType === "MusicArtist" || rRow.RowType === "BoxSet") {
                        html += '<i class="md-icon" title="Missing logo image.">photo</i>';
                    }
                }
                break;
            default:
                html += rItem.Name;
        }
        html += '</td>';
        return html;
    }

    function ExportReport(page, e) {

        query.UserId = ApiClient.getCurrentUserId();
        query.HasQueryLimit = false;
        var url = ApiClient.getUrl("Reports/Items/Download", query);

        if (url) {
            window.location.href = url + "&api_key=" + ApiClient.accessToken();
        }
    }

    function loadGroupByFilters(page) {

        query.UserId = ApiClient.getCurrentUserId();
        var url = "";

        url = ApiClient.getUrl("Reports/Headers", query);
        ApiClient.getJSON(url).then(function (result) {
            var selected = "None";

            $('#selectReportGroup', page).find('option').remove().end();
            $('#selectReportGroup', page).append('<option value="None"></option>');

            result.map(function (header) {
                if ((header.DisplayType === "Screen" || header.DisplayType === "ScreenExport") && header.CanGroup) {
                    if (header.FieldName.length > 0) {
                        var option = '<option value="' + header.FieldName + '">' + header.Name + '</option>';
                        $('#selectReportGroup', page).append(option);
                        if (query.GroupBy === header.FieldName)
                            selected = header.FieldName;
                    }
                }
            });
            $('#selectPageSize', page).val(selected);

        });
    }

    function getQueryPagingHtml(options) {
        var startIndex = options.startIndex;
        var limit = options.limit;
        var totalRecordCount = options.totalRecordCount;

        var html = '';

        var recordsEnd = Math.min(startIndex + limit, totalRecordCount);

        var showControls = limit < totalRecordCount;

        html += '<div class="listPaging">';

        if (showControls) {
            html += '<span style="vertical-align:middle;">';

            var startAtDisplay = totalRecordCount ? startIndex + 1 : 0;
            html += startAtDisplay + '-' + recordsEnd + ' of ' + totalRecordCount;

            html += '</span>';

            html += '<div style="display:inline-block;">';

            html += '<button is="paper-icon-button-light" class="btnPreviousPage autoSize" ' + (startIndex ? '' : 'disabled') + '><i class="md-icon">&#xE5C4;</i></button>';
            html += '<button is="paper-icon-button-light" class="btnNextPage autoSize" ' + (startIndex + limit >= totalRecordCount ? 'disabled' : '') + '><i class="md-icon">&#xE5C8;</i></button>';

            html += '</div>';
        }

        html += '</div>';

        return html;
    }

    function renderItems(page, result) {

        window.scrollTo(0, 0);
        var html = '';

        if (query.ReportView === "ReportData") {
            $('#selectIncludeItemTypesBox', page).show();
            $('#tabFilter', page).show();
        }
        else {
            $('#selectIncludeItemTypesBox', page).hide();
            $('#tabFilterBox', page).hide();
            $('#tabFilter', page).hide();
        }

        var pagingHtml = "Total : " + result.TotalRecordCount;
        if (query.Limit != -1) {
            pagingHtml = getQueryPagingHtml({
                startIndex: query.StartIndex,
                limit: query.Limit,
                totalRecordCount: result.TotalRecordCount,
                updatePageSizeSetting: false,
                viewButton: true,
                showLimit: false
            });
        }

        if (query.ReportView === "ReportData" || query.ReportView === "ReportActivities") {


            $('.listTopPaging', page).html(pagingHtml);
            // page.querySelector('.listTopPaging').innerHTML = pagingHtml;
            $('.listTopPaging', page).show();

            $('.listBottomPaging', page).html(pagingHtml);
            $('.listBottomPaging', page).show();

            $('.btnNextPage', page).on('click', function () {
                query.StartIndex += query.Limit;
                reloadItems(page);
            });
            $('.btnNextPage', page).show();

            $('.btnPreviousPage', page).on('click', function () {
                query.StartIndex -= query.Limit;
                reloadItems(page);
            });
            $('.btnPreviousPage', page).show();

            $('#btnReportExport', page).show();
            $('#selectPageSizeBox', page).show();
            $('#selectReportGroupingBox', page).show();
            $('#grpReportsColumns', page).show();

            var initial_state = $('#chkStartCollapsed', page).prop('checked');
            html += getTable(result, initial_state);

            $('.reporContainer', page).html(html);

            $('.lnkShowHideRows', page).on('click', function () {
                var row_id = this.getAttribute('data-group_id');
                var row_id_index = 'row_id_' + row_id;
                var row_group_state = this.getAttribute("data-group_state");
                //alert(this.getAttribute("data-group_state"));
                if (row_group_state == "table-row") {
                    this.setAttribute("data-group_state", "none");
                    $('.' + row_id_index, page).css("display", "none");
                    this.innerHTML = "&#x25B6;";
                }
                else {
                    this.setAttribute("data-group_state", "table-row");
                    $('.' + row_id_index, page).css("display", "table-row");
                    this.innerHTML = "&#x25BC;";
                }
            });

            $('.lnkColumnSort', page).on('click', function () {

                var order = this.getAttribute('data-sortfield');

                if (query.SortBy === order) {

                    if (query.SortOrder === "Descending") {

                        query.SortOrder = "Ascending";
                        query.SortBy = defaultSortBy;

                    } else {

                        query.SortOrder = "Descending";
                        query.SortBy = order;
                    }

                } else {

                    query.SortOrder = "Ascending";
                    query.SortBy = order;
                }

                query.StartIndex = 0;

                reloadItems(page);
            });
        }

        $('#GroupStatus', page).hide();
        $('#GroupAirDays', page).hide();
        $('#GroupEpisodes', page).hide();
        switch (query.IncludeItemTypes) {
            case "Series":
            case "Season":
                $('#GroupStatus', page).show();
                $('#GroupAirDays', page).show();
                break;
            case "Episode":
                $('#GroupStatus', page).show();
                $('#GroupAirDays', page).show();
                $('#GroupEpisodes', page).show();
                break;
        }
    }

    function reloadItems(page) {
        loading.show();

        query.UserId = ApiClient.getCurrentUserId();
        var url = "";

        switch (query.ReportView) {
            case "ReportData":
                query.HasQueryLimit = true;
                url = ApiClient.getUrl("Reports/Items", query);
                break;
            case "ReportActivities":
                query.HasQueryLimit = true;
                url = ApiClient.getUrl("Reports/Activities", query);
                break;
        }

        ApiClient.getJSON(url).then(function (result) {
            updateFilterControls(page);
            renderItems(page, result);
        });


        loading.hide();
    }

    function updateFilterControls(page) {
        $('.chkStandardFilter', page).each(function () {

            var filters = "," + (query.Filters || "");
            var filterName = this.getAttribute('data-filter');

            this.checked = filters.indexOf(',' + filterName) != -1;

        });


        $('.chkVideoTypeFilter', page).each(function () {

            var filters = "," + (query.VideoTypes || "");
            var filterName = this.getAttribute('data-filter');

            this.checked = filters.indexOf(',' + filterName) != -1;

        });

        $('.chkStatus', page).each(function () {

            var filters = "," + (query.SeriesStatus || "");
            var filterName = this.getAttribute('data-filter');

            this.checked = filters.indexOf(',' + filterName) != -1;

        });

        $('.chkAirDays', page).each(function () {

            var filters = "," + (query.AirDays || "");
            var filterName = this.getAttribute('data-filter');

            this.checked = filters.indexOf(',' + filterName) != -1;

        });

        page.querySelector('#chk3D').checked = query.Is3D == true;
        page.querySelector('#chkHD').checked = query.IsHD == true;
        page.querySelector('#chkSD').checked = query.IsHD == false;

        page.querySelector('#chkSubtitle').checked = query.HasSubtitles == true;
        page.querySelector('#chkTrailer').checked = query.HasTrailer == true;
        page.querySelector('#chkMissingTrailer').checked = query.HasTrailer == false;
        page.querySelector('#chkSpecialFeature').checked = query.HasSpecialFeature == true;
        page.querySelector('#chkThemeSong').checked = query.HasThemeSong == true;
        page.querySelector('#chkThemeVideo').checked = query.HasThemeVideo == true;

        $('#selectPageSize', page).val(query.Limit);

        //Management
        page.querySelector('#chkMissingRating').checked = query.HasOfficialRating == false;
        page.querySelector('#chkMissingOverview').checked = query.HasOverview == false;
        page.querySelector('#chkIsLocked').checked = query.IsLocked == true;
        page.querySelector('#chkMissingImdbId').checked = query.HasImdbId == false;
        page.querySelector('#chkMissingTmdbId').checked = query.HasTmdbId == false;
        page.querySelector('#chkMissingTvdbId').checked = query.HasTvdbId == false;

        //Episodes
        page.querySelector('#chkSpecialEpisode').checked = query.ParentIndexNumber == 0;
        page.querySelector('#chkMissingEpisode').checked = query.IsMissing == true;

        $('#selectIncludeItemTypes').val(query.IncludeItemTypes);

        // isfavorite
        page.querySelector('#chkIsFavorite').checked = query.IsFavorite == true;
        page.querySelector('#chkIsNotFavorite').checked = query.IsNotFavorite == true;


    }

    var filtersLoaded;
    function reloadFiltersIfNeeded(page) {
        if (!filtersLoaded) {

            filtersLoaded = true;

            QueryReportFilters.loadFilters(page, ApiClient.getCurrentUserId(), query, function () {

                reloadItems(page);
            });

            QueryReportColumns.loadColumns(page, ApiClient.getCurrentUserId(), query, function () {

                reloadItems(page);
            });
        }
    }

    function renderOptions(page, selector, cssClass, items) {

        var elem;

        if (items.length) {

            elem = $(selector, page).show();

        } else {
            elem = $(selector, page).hide();
        }

        var html = '';

        //  style="margin: -.2em -.8em;"
        html += '<div data-role="controlgroup">';

        var index = 0;
        var idPrefix = 'chk' + selector.substring(1);

        html += items.map(function (filter) {

            var itemHtml = '';

            var id = idPrefix + index;
            var label = filter;
            var value = filter;
            var checked = false;
            if (filter.FieldName) {
                label = filter.Name;
                value = filter.FieldName;
                checked = filter.Visible;
            }

            itemHtml += '<input id="' + id + '" type="checkbox" data-filter="' + value + '" class="' + cssClass + '"';
            if (checked)
                itemHtml += ' checked="checked" ';
            itemHtml += '/> ';
            itemHtml += '<label for="' + id + '">' + label + '</label>';
            itemHtml += '<br/>';

            index++;

            return itemHtml;

        }).join('');

        html += '</div>';

        $('.filterOptions', elem).html(html);
    }

    function renderFilters(page, result) {


        if (result.Tags) {
            result.Tags.length = Math.min(result.Tags.length, 50);
        }

        renderOptions(page, '.genreFilters', 'chkGenreFilter', result.Genres);
        renderOptions(page, '.officialRatingFilters', 'chkOfficialRatingFilter', result.OfficialRatings);
        renderOptions(page, '.tagFilters', 'chkTagFilter', result.Tags);
        renderOptions(page, '.yearFilters', 'chkYearFilter', result.Years);

    }

    function renderColumnss(page, result) {


        if (result.Tags) {
            result.Tags.length = Math.min(result.Tags.length, 50);
        }

        renderOptions(page, '.reportsColumns', 'chkReportColumns', result);
    }

    function onFiltersLoaded(page, query, reloadItemsFn) {

        $('.chkGenreFilter', page).on('change', function () {

            var filterName = this.getAttribute('data-filter');
            var filters = query.Genres || "";
            var delimiter = '|';

            filters = (delimiter + filters).replace(delimiter + filterName, '').substring(1);

            if (this.checked) {
                filters = filters ? (filters + delimiter + filterName) : filterName;
            }

            query.StartIndex = 0;
            query.Genres = filters;

            reloadItemsFn();
        });
        $('.chkTagFilter', page).on('change', function () {

            var filterName = this.getAttribute('data-filter');
            var filters = query.Tags || "";
            var delimiter = '|';

            filters = (delimiter + filters).replace(delimiter + filterName, '').substring(1);

            if (this.checked) {
                filters = filters ? (filters + delimiter + filterName) : filterName;
            }

            query.StartIndex = 0;
            query.Tags = filters;

            reloadItemsFn();
        });
        $('.chkYearFilter', page).on('change', function () {

            var filterName = this.getAttribute('data-filter');
            var filters = query.Years || "";
            var delimiter = ',';

            filters = (delimiter + filters).replace(delimiter + filterName, '').substring(1);

            if (this.checked) {
                filters = filters ? (filters + delimiter + filterName) : filterName;
            }

            query.StartIndex = 0;
            query.Years = filters;

            reloadItemsFn();
        });
        $('.chkOfficialRatingFilter', page).on('change', function () {

            var filterName = this.getAttribute('data-filter');
            var filters = query.OfficialRatings || "";
            var delimiter = '|';

            filters = (delimiter + filters).replace(delimiter + filterName, '').substring(1);

            if (this.checked) {
                filters = filters ? (filters + delimiter + filterName) : filterName;
            }

            query.StartIndex = 0;
            query.OfficialRatings = filters;

            reloadItemsFn();
        });
    }

    function onColumnsLoaded(page, query, reloadItemsFn) {

        $('.chkReportColumns', page).on('change', function () {

            var filterName = this.getAttribute('data-filter');
            var filters = query.ReportColumns || "";
            var delimiter = '|';

            filters = (delimiter + filters).replace(delimiter + filterName, '').substring(1);

            if (this.checked) {
                filters = filters ? (filters + delimiter + filterName) : filterName;
            }

            query.StartIndex = 0;
            query.ReportColumns = filters;

            reloadItemsFn();
        });
    }

    function loadFilters(page, userId, itemQuery, reloadItemsFn) {

        return ApiClient.getJSON(ApiClient.getUrl('Items/Filters', {

            UserId: userId,
            ParentId: itemQuery.ParentId,
            IncludeItemTypes: itemQuery.IncludeItemTypes,
            ReportView: itemQuery.ReportView


        })).then(function (result) {

            renderFilters(page, result);

            onFiltersLoaded(page, itemQuery, reloadItemsFn);
        });
    }

    function loadColumns(page, userId, itemQuery, reloadItemsFn) {

        return ApiClient.getJSON(ApiClient.getUrl('Reports/Headers', {

            UserId: userId,
            IncludeItemTypes: itemQuery.IncludeItemTypes,
            ReportView: itemQuery.ReportView

        })).then(function (result) {

            renderColumnss(page, result);
            var filters = "";
            var delimiter = '|';
            result.map(function (item) {

                if ((item.DisplayType === "Screen" || item.DisplayType === "ScreenExport"))
                    filters = filters ? (filters + delimiter + item.FieldName) : item.FieldName;
            });
            if (!itemQuery.ReportColumns)
                itemQuery.ReportColumns = filters;
            onColumnsLoaded(page, itemQuery, reloadItemsFn);
        });

    }

    function onPageShow(page, query) {
        query.Genres = null;
        query.Years = null;
        query.OfficialRatings = null;
        query.Tags = null;

    }

    function onPageReportColumnsShow(page, query) {
        query.ReportColumns = null;
    }

    window.QueryReportFilters = {
        loadFilters: loadFilters,
        onPageShow: onPageShow
    };

    window.QueryReportColumns = {
        loadColumns: loadColumns,
        onPageShow: onPageReportColumnsShow
    };

    function View(view, params) {

        BaseView.apply(this, arguments);

        var page = view;

        view.querySelector('.btnClosePopup').addEventListener('click', function () {

            this.closest('.dialog').classList.add('hide');
        });

        $('#selectIncludeItemTypes', page).on('change', function () {

            query.StartIndex = 0;
            query.ReportView = $('#selectViewType', page).val();
            query.IncludeItemTypes = this.value;
            query.SortOrder = "Ascending";
            query.ReportColumns = null;
            $('.btnReportExport', page).hide();
            filtersLoaded = false;
            loadGroupByFilters(page);
            reloadFiltersIfNeeded(page);
            reloadItems(page);
        });

        $('#selectViewType', page).on('change', function () {

            query.StartIndex = 0;
            query.ReportView = this.value;
            query.IncludeItemTypes = $('#selectIncludeItemTypes', page).val();
            query.SortOrder = "Ascending";
            filtersLoaded = false;
            query.ReportColumns = null;
            loadGroupByFilters(page);
            reloadFiltersIfNeeded(page);
            reloadItems(page);
        });

        $('#selectReportGroup', page).on('change', function () {
            query.GroupBy = this.value;
            query.StartIndex = 0;
            reloadItems(page);
        });

        $('#chkStartCollapsed', page).on('change', function () {
            reloadItems(page);
        });

        $('#btnReportExportCsv', page).on('click', function (e) {

            query.ExportType = "CSV";
            ExportReport(page, e);
        });

        $('#btnReportExportExcel', page).on('click', function (e) {

            query.ExportType = "Excel";
            ExportReport(page, e);
        });

        $('#btnResetReportColumns', page).on('click', function (e) {

            query.ReportColumns = null;
            query.StartIndex = 0;
            filtersLoaded = false;
            reloadFiltersIfNeeded(page);
            reloadItems(page);
        });

        $('#selectPageSize', page).on('change', function () {
            query.Limit = parseInt(this.value);
            query.StartIndex = 0;
            reloadItems(page);
        });

        $('#chkIsFavorite', page).on('change', function () {

            if (this.checked) {
                query.IsFavorite = true;
            }
            else {
                query.IsFavorite = false;
            }
            reloadItems(page);
        });

        $('#chkIsNotFavorite', page).on('change', function () {

            if (this.checked) {
                query.IsNotFavorite = true;
            }
            else {
                query.IsNotFavorite = false;
            }
            reloadItems(page);
        });

        $('.chkStandardFilter', page).on('change', function () {

            var filterName = this.getAttribute('data-filter');
            var filters = query.Filters || "";

            filters = (',' + filters).replace(',' + filterName, '').substring(1);

            if (this.checked) {
                filters = filters ? (filters + ',' + filterName) : filterName;
            }

            query.StartIndex = 0;
            query.Filters = filters;

            reloadItems(page);
        });

        $('.chkVideoTypeFilter', page).on('change', function () {

            var filterName = this.getAttribute('data-filter');
            var filters = query.VideoTypes || "";

            filters = (',' + filters).replace(',' + filterName, '').substring(1);

            if (this.checked) {
                filters = filters ? (filters + ',' + filterName) : filterName;
            }

            query.StartIndex = 0;
            query.VideoTypes = filters;

            reloadItems(page);
        });

        $('#chk3D', page).on('change', function () {

            query.StartIndex = 0;
            query.Is3D = this.checked ? true : null;

            reloadItems(page);
        });

        $('#chkHD', page).on('change', function () {

            query.StartIndex = 0;
            query.IsHD = this.checked ? true : null;

            reloadItems(page);
        });

        $('#chkSD', page).on('change', function () {

            query.StartIndex = 0;
            query.IsHD = this.checked ? false : null;

            reloadItems(page);
        });

        $('#chkSubtitle', page).on('change', function () {

            query.StartIndex = 0;
            query.HasSubtitles = this.checked ? true : null;

            reloadItems(page);
        });

        $('#chkTrailer', page).on('change', function () {

            query.StartIndex = 0;
            query.HasTrailer = this.checked ? true : null;

            reloadItems(page);
        });

        $('#chkMissingTrailer', page).on('change', function () {

            query.StartIndex = 0;
            query.HasTrailer = this.checked ? false : null;

            reloadItems(page);
        });

        $('#chkSpecialFeature', page).on('change', function () {

            query.StartIndex = 0;
            query.HasSpecialFeature = this.checked ? true : null;

            reloadItems(page);
        });

        $('#chkThemeSong', page).on('change', function () {

            query.StartIndex = 0;
            query.HasThemeSong = this.checked ? true : null;

            reloadItems(page);
        });

        $('#chkThemeVideo', page).on('change', function () {

            query.StartIndex = 0;
            query.HasThemeVideo = this.checked ? true : null;

            reloadItems(page);
        });

        $('#radioBasicFilters', page).on('change', function () {

            if (this.checked) {
                $('.basicFilters', page).show();
                $('.advancedFilters', page).hide();
            } else {
                $('.basicFilters', page).hide();
            }
        });

        $('#radioAdvancedFilters', page).on('change', function () {

            if (this.checked) {
                $('.advancedFilters', page).show();
                $('.basicFilters', page).hide();
            } else {
                $('.advancedFilters', page).hide();
            }
        });

        //Management
        $('#chkIsLocked', page).on('change', function () {

            query.StartIndex = 0;
            query.IsLocked = this.checked ? true : null;

            reloadItems(page);
        });

        $('#chkMissingOverview', page).on('change', function () {

            query.StartIndex = 0;
            query.HasOverview = this.checked ? false : null;

            reloadItems(page);
        });

        $('#chkMissingEpisode', page).on('change', function () {

            query.StartIndex = 0;
            query.IsMissing = this.checked ? true : false;

            reloadItems(page);
        });

        $('#chkMissingRating', page).on('change', function () {

            query.StartIndex = 0;
            query.HasOfficialRating = this.checked ? false : null;

            reloadItems(page);
        });

        $('#chkMissingImdbId', page).on('change', function () {

            query.StartIndex = 0;
            query.HasImdbId = this.checked ? false : null;

            reloadItems(page);
        });

        $('#chkMissingTmdbId', page).on('change', function () {

            query.StartIndex = 0;
            query.HasTmdbId = this.checked ? false : null;

            reloadItems(page);
        });

        $('#chkMissingTvdbId', page).on('change', function () {

            query.StartIndex = 0;
            query.HasTvdbId = this.checked ? false : null;

            reloadItems(page);
        });

        //Episodes
        $('#chkMissingEpisode', page).on('change', function () {

            query.StartIndex = 0;
            query.IsMissing = this.checked ? true : false;

            reloadItems(page);
        });

        $('#chkSpecialEpisode', page).on('change', function () {

            query.ParentIndexNumber = this.checked ? 0 : null;

            reloadItems(page);
        });

        $('.chkAirDays', page).on('change', function () {

            var filterName = this.getAttribute('data-filter');
            var filters = query.AirDays || "";

            filters = (',' + filters).replace(',' + filterName, '').substring(1);

            if (this.checked) {
                filters = filters ? (filters + ',' + filterName) : filterName;
            }

            query.AirDays = filters;
            query.StartIndex = 0;
            reloadItems(page);
        });

        $('.chkStatus', page).on('change', function () {

            var filterName = this.getAttribute('data-filter');
            var filters = query.SeriesStatus || "";

            filters = (',' + filters).replace(',' + filterName, '').substring(1);

            if (this.checked) {
                filters = filters ? (filters + ',' + filterName) : filterName;
            }

            query.SeriesStatus = filters;
            query.StartIndex = 0;
            reloadItems(page);
        });

        $(page.getElementsByClassName('viewTabButton')).on('click', function () {

            var parent = $(this).parents('.viewPanel');
            $('.viewTabButton', parent).removeClass('ui-btn-active');
            this.classList.add('ui-btn-active');

            $('.viewTab', parent).addClass('hide');
            $('.' + this.getAttribute('data-tab'), parent).removeClass('hide');
        });

        page.querySelector('.btnOpenMore').addEventListener('click', function () {
            page.querySelector('.viewPanel').classList.remove('hide');
            reloadFiltersIfNeeded(page);
        });
    }

    Object.assign(View.prototype, BaseView.prototype);

    View.prototype.onResume = function (options) {

        BaseView.prototype.onResume.apply(this, arguments);

        loading.show();

        query.UserId = ApiClient.getCurrentUserId();
        var page = this.view;
        query.SortOrder = "Ascending";

        QueryReportFilters.onPageShow(page, query);
        QueryReportColumns.onPageShow(page, query);
        $('#selectIncludeItemTypes', page).val(query.IncludeItemTypes).trigger('change');

        updateFilterControls(page);

        filtersLoaded = false;
        updateFilterControls(page);
    };

    return View;
});