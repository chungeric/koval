import React, { Component } from 'react';
import queryString from 'query-string';
import axios from 'axios';


export default function Previewable(WrappedComponent){
  return class extends Component{
    state = { fetchingData: false, hasPreview: false };

    async componentWillMount() {
      const { location, data: graphQLData } = this.props;
      const { site } = graphQLData;
      const { siteMetadata } = site;
      const { functionsUrl } = siteMetadata;
      const queries = queryString.parse(location.search);
      // Handle errors
      let error = null;
      if (!functionsUrl) error = 'Please make sure you add functionsUrl within the siteMetadata section in your pageQuery';
      if (!functionsUrl) error = 'Please make sure you add functionsUrl within the siteMetadata section in your pageQuery';
      if (!queries.posttype) error = 'Please include a posttype query string';
      if (!queries.preview_id) error = 'Please include a preview_id query string';
      // Fetch preview data and save to state if conditions are met
      if (queries && queries.preview_id && !error) {
        this.setState({ fetchingData: true, hasPreview: true });
        const previewRes = await axios.get(`${functionsUrl}/previews?endpoint=${queries.posttype}s&preview_id=${queries.preview_id}`);
        const { data } = previewRes;
        // If response comes back null or fails show error UI
        if (!data || !data.title) {
          error = 'Unable to fetch preview data, is your functionsUrl pointing at the correct endpoint?'
        } else {
          // Save new data to state
          this.setState({ fetchingData: false, newData: data });
        }
      }
      // Handle error UI
      if (error) this.setState({ error, fetchingData: false });
    }

    render() {
      const { data, location } = this.props;
      const { fetchingData, hasPreview, newData, error } = this.state;
      const queries = queryString.parse(location.search);
      const { posttype } = queries;
      // Show fetching UI
      if (fetchingData) return <p>Fetching preview</p>;
      // Show error UI
      if (error) return <p>{error}</p>;
      // Show preview data
      if (hasPreview) {
        // Get post type with capitalise first letter
        const postType = posttype.charAt(0).toUpperCase() + posttype.substring(1, posttype.length);
        // Mimic GraphQL key
        const graphQLKey = `wordpress${postType}`;
        // Check for ACF
        const hasAcf = newData.acf && newData.acf.layout;
        // Generate preview data consisting of new and existing data
        const previewData = {
          ...data,
          [graphQLKey]: {
            ...data[graphQLKey],
            title: newData.title ? newData.title.rendered : null,
            content: newData.content ? newData.content.rendered : null,
            acf: {
              layout: hasAcf ? newData.acf.layout.map((item, index) => ({ ...item, __typename: `WordPressAcf_${item.acf_fc_layout}`, id: index })) : []
            }
          }
        };
        // Return wrapped component with new preview data values overwriting existing
        return <WrappedComponent {...this.props} data={previewData} />
      }
      // Not previewing return wrapped component as is
      return <WrappedComponent {...this.props} />;
    }
  }
}