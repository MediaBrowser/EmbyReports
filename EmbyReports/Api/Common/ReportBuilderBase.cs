﻿using MediaBrowser.Controller.Entities;
using MediaBrowser.Controller.Entities.TV;
using MediaBrowser.Controller.Library;
using MediaBrowser.Model.Channels;
using MediaBrowser.Model.Dto;
using MediaBrowser.Model.Entities;
using System;
using System.Collections.Generic;
using System.Linq;
using EmbyReports.Api.Data;
using EmbyReports.Api.Model;

namespace EmbyReports.Api.Common
{
    /// <summary> A report builder base. </summary>
    public abstract class ReportBuilderBase
    {

        #region [Constructors]

        /// <summary>
        /// Initializes a new instance of the MediaBrowser.Api.Reports.ReportBuilderBase class. </summary>
        /// <param name="libraryManager"> Manager for library. </param>
        public ReportBuilderBase(ILibraryManager libraryManager)
        {
            _libraryManager = libraryManager;
        }

        #endregion

        #region [Protected Fields]

        /// <summary> Manager for library. </summary>
        protected readonly ILibraryManager _libraryManager; ///< Manager for library

        protected Func<bool, string> GetBoolString = s => s == true ? "x" : ""; ///< .

        #endregion

        #region [Protected Internal Methods]

        /// <summary> Gets the headers. </summary>
        /// <typeparam name="H"> Type of the header. </typeparam>
        /// <param name="request"> The request. </param>
        /// <returns> The headers. </returns>
        protected internal abstract List<ReportHeader> GetHeaders<H>(H request) where H : IReportsHeader;

        #endregion

        #region [Protected Methods]

        /// <summary> Gets active headers. </summary>
        /// <typeparam name="T"> Generic type parameter. </typeparam>
        /// <param name="options"> Options for controlling the operation. </param>
        /// <returns> The active headers. </returns>
        protected List<ReportHeader> GetActiveHeaders<T>(List<ReportOptions<T>> options, ReportDisplayType displayType)
        {
            List<ReportHeader> headers = new List<ReportHeader>();
            foreach (ReportOptions<T> option in options.Where(x => this.DisplayTypeVisible(x.Header.DisplayType, displayType)))
            {
                headers.Add(option.Header);
            }

            return headers;
        }

        /// <summary> Gets audio stream. </summary>
        /// <param name="item"> The item. </param>
        /// <returns> The audio stream. </returns>
        protected string GetAudioStream(BaseItem item)
        {
            var stream = item.GetMediaStreams().FirstOrDefault(i => i.Type == MediaStreamType.Audio);
            if (stream != null)
                return stream.Codec.ToUpper() == "DCA" ? stream.Profile : stream.Codec.
                ToUpper();
            
            return string.Empty;
        }

        /// <summary> Gets an episode. </summary>
        /// <param name="item"> The item. </param>
        /// <returns> The episode. </returns>
        protected string GetEpisode(BaseItem item)
        {

            if (item.GetClientTypeName() == ChannelMediaContentType.Episode.ToString() && item.ParentIndexNumber != null)
                return "Season " + item.ParentIndexNumber;
            else
                return item.Name;
        }

        /// <summary> Gets the headers. </summary>
        /// <typeparam name="T"> Generic type parameter. </typeparam>
        /// <param name="options"> Options for controlling the operation. </param>
        /// <returns> The headers. </returns>
        protected List<ReportHeader> GetHeaders<T>(List<ReportOptions<T>> options)
        {
            List<ReportHeader> headers = new List<ReportHeader>();
            foreach (ReportOptions<T> option in options)
            {
                headers.Add(option.Header);
            }

            return headers;
        }

        /// <summary> Gets the headers. </summary>
        /// <typeparam name="T"> Generic type parameter. </typeparam>
        /// <param name="request"> The request. </param>
        /// <param name="getHeadersMetadata"> The get headers metadata. </param>
        /// <param name="getOptions"> Options for controlling the get. </param>
        /// <returns> The headers. </returns>
        protected List<ReportHeader> GetHeaders<T>(IReportsHeader request, Func<List<HeaderMetadata>> getHeadersMetadata, Func<HeaderMetadata, ReportOptions<T>> getOptions)
        {
            List<ReportOptions<T>> options = this.GetReportOptions(request, getHeadersMetadata, getOptions);
            return this.GetHeaders(options);
        }

        /// <summary> Gets list as string. </summary>
        /// <param name="items"> The items. </param>
        /// <returns> The list as string. </returns>
        protected string GetListAsString(List<string> items)
        {
            return String.Join("; ", items);
        }

        /// <summary> Gets localized header. </summary>
        /// <param name="internalHeader"> The internal header. </param>
        /// <returns> The localized header. </returns>
        protected static string GetLocalizedHeader(HeaderMetadata internalHeader)
        {
            if (internalHeader == HeaderMetadata.EpisodeNumber)
            {
                return "Episode";
            }

            string headerName = "";
            if (internalHeader != HeaderMetadata.None)
            {
                string localHeader = internalHeader.ToString();
                headerName = ReportHelper.GetCoreLocalizedString(localHeader);
            }
            return headerName;
        }

        /// <summary> Gets an object. </summary>
        /// <typeparam name="T"> Generic type parameter. </typeparam>
        /// <typeparam name="R"> Type of the r. </typeparam>
        /// <param name="item"> The item. </param>
        /// <param name="function"> The function. </param>
        /// <param name="defaultValue"> The default value. </param>
        /// <returns> The object. </returns>
        protected R GetObject<T, R>(BaseItem item, Func<T, R> function, R defaultValue = default(R)) where T : class
        {
            var value = item as T;
            if (value != null && function != null)
                return function(value);
            else
                return defaultValue;
        }

        /// <summary> Gets a person. </summary>
        /// <param name="name"> The name. </param>
        /// <returns> The person. </returns>
        protected Person GetPerson(string name)
        {
            if (string.IsNullOrEmpty(name))
                return null;
            return _libraryManager.GetItemList(new InternalItemsQuery
            {
                Name = name,
                IncludeItemTypes = new[] { typeof(Person).Name },

            }).OfType<Person>().FirstOrDefault();
        }

        /// <summary> Gets person identifier. </summary>
        /// <param name="name"> The name. </param>
        /// <returns> The person identifier. </returns>
        protected string GetPersonID(string name)
        {
            if (string.IsNullOrEmpty(name))
                return string.Empty;
            Person person = GetPerson(name);
            if (person == null)
                return string.Empty;
            return string.Format("{0:N}", person.Id);
        }

        /// <summary> Gets report options. </summary>
        /// <typeparam name="T"> Generic type parameter. </typeparam>
        /// <param name="request"> The request. </param>
        /// <param name="getHeadersMetadata"> The get headers metadata. </param>
        /// <param name="getOptions"> Options for controlling the get. </param>
        /// <returns> The report options. </returns>
        protected List<ReportOptions<T>> GetReportOptions<T>(IReportsHeader request, Func<List<HeaderMetadata>> getHeadersMetadata, Func<HeaderMetadata, ReportOptions<T>> getOptions)
        {
            List<HeaderMetadata> headersMetadata = getHeadersMetadata();
            List<ReportOptions<T>> options = new List<ReportOptions<T>>();
            ReportDisplayType displayType = ReportHelper.GetReportDisplayType(request.DisplayType);
            foreach (HeaderMetadata header in headersMetadata)
            {
                ReportOptions<T> headerOptions = getOptions(header);
                if (this.DisplayTypeVisible(headerOptions.Header.DisplayType, displayType))
                    options.Add(headerOptions);
            }

            if (request != null && !string.IsNullOrEmpty(request.ReportColumns))
            {
                List<HeaderMetadata> headersMetadataFiltered = ReportHelper.GetFilteredReportHeaderMetadata(request.ReportColumns, () => headersMetadata);
                foreach (ReportHeader header in options.Select(x => x.Header))
                {

                    if (this.DisplayTypeVisible(header.DisplayType, displayType))
                    {

                        if (!headersMetadataFiltered.Contains(header.FieldName) && displayType != ReportDisplayType.Export)
                        {
                            header.DisplayType = ReportDisplayType.None;
                        }
                    }
                    else
                        header.DisplayType = ReportDisplayType.None;
                }
            }

            return options;
        }

        /// <summary> Gets runtime date time. </summary>
        /// <param name="runtime"> The runtime. </param>
        /// <returns> The runtime date time. </returns>
        protected double? GetRuntimeDateTime(long? runtime)
        {
            if (runtime.HasValue)
                return Math.Ceiling(new TimeSpan(runtime.Value).TotalMinutes);
            return null;
        }

        /// <summary> Gets series production year. </summary>
        /// <param name="item"> The item. </param>
        /// <returns> The series production year. </returns>
        protected string GetSeriesProductionYear(BaseItem item)
        {

            string productionYear = item.ProductionYear.ToString();
            var series = item as Series;
            if (series == null)
            {
                if (item.ProductionYear == null || item.ProductionYear == 0)
                    return string.Empty;
                return productionYear;
            }

            if (series.Status == SeriesStatus.Continuing)
                return productionYear += "-Present";

            if (series.EndDate != null && series.EndDate.Value.Year != series.ProductionYear)
                return productionYear += "-" + series.EndDate.Value.Year;

            return productionYear;
        }

        /// <summary> Gets a studio. </summary>
        /// <param name="name"> The name. </param>
        /// <returns> The studio. </returns>
        protected Studio GetStudio(string name)
        {
            if (string.IsNullOrEmpty(name))
                return null;
            return _libraryManager.GetItemList(new InternalItemsQuery
            {
                Name = name,
                IncludeItemTypes = new[] { typeof(Studio).Name },

            }).OfType<Studio>().FirstOrDefault();
        }

        /// <summary> Gets studio identifier. </summary>
        /// <param name="name"> The name. </param>
        /// <returns> The studio identifier. </returns>
        protected string GetStudioID(string name)
        {
            if (string.IsNullOrEmpty(name))
                return string.Empty;

            var studio = GetStudio(name);

            if (studio == null)
            {
                return null;
            }

            return string.Format("{0:N}",
                    studio.Id);
        }

        /// <summary> Gets video resolution - Height and Width. </summary>
        /// <param name="item"> The item. </param>
        /// <returns> The video resolution. </returns>
        protected string GetHeight(BaseItem item)
        {
            if (item.Height > 0)
                return string.Format("{0}",
                        item.Height);

            return string.Empty;
        }
        protected string GetWidth(BaseItem item)
        {
            if (item.Width > 0)
                return string.Format("{0}",
                        item.Width);

            return string.Empty;
        }

        /// <summary> Gets video stream. </summary>
        /// <param name="item"> The item. </param>
        /// <returns> The video stream. </returns>
        protected string GetVideoStream(BaseItem item)
        {
            var stream = item.GetMediaStreams().FirstOrDefault(i => i.Type == MediaStreamType.Video);
            if (stream != null)
                return stream.Codec?.ToUpper();

            return string.Empty;
        }

        /// <summary> Displays a type visible. </summary>
        /// <param name="headerDisplayType"> Type of the header display. </param>
        /// <param name="displayType"> Type of the display. </param>
        /// <returns> true if it succeeds, false if it fails. </returns>
        protected bool DisplayTypeVisible(ReportDisplayType headerDisplayType, ReportDisplayType displayType)
        {
            if (headerDisplayType == ReportDisplayType.None)
                return false;

            bool rval = headerDisplayType == displayType || headerDisplayType == ReportDisplayType.ScreenExport && (displayType == ReportDisplayType.Screen || displayType == ReportDisplayType.Export);
            return rval;
        }

        #endregion

    }
}
