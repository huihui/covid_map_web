import React, { useRef, useEffect } from "react";
import Helmet from 'react-helmet';
import L from 'leaflet';
import { Marker, useMap } from "react-leaflet";

import axios from 'axios';

import { promiseToFlyTo, getCurrentLocation } from "lib/map";

import Layout from 'components/Layout';
import Container from 'components/Container';
import Map from 'components/Map';

const LOCATION = {
  lat: 38.9072,
  lng: -77.0369
};
const CENTER = [LOCATION.lat, LOCATION.lng];
const DEFAULT_ZOOM = 2;

const ZOOM = 2.5;

  /**
   * MapEffect
   * @description Fires a callback once the page renders
   * @example Here this is and example of being used to zoom in and set a popup on load
   */

   const MapEffect = ({ markerRef }) => {
    const map = useMap();
    console.log("---1---");

    useEffect(() => {
      console.log("---2---");
      console.log("markerRef.current");

      console.log(markerRef.current);
      if ( !map) return;
  
      console.log("---3---");
      (async function run() {
        console.log("---4---");
        let response;

        try {
          response = await axios.get('https://corona.lmao.ninja/v3/covid-19/countries');
        } catch(e) {
          console.log(`Failed to fetch countries: ${e.message}`, e);
          return;
        }
    
        const { data = [] } = response;
        console.log(data);

        const hasData = Array.isArray(data) && data.length > 0;
        if ( !hasData ) return;

        const location = await getCurrentLocation().catch(() => LOCATION);
        console.log('location - ');
        console.log(location);

        await promiseToFlyTo(map, {
          zoom: ZOOM,
          center: location,
        });
    
        const geoJson = {
          type: 'FeatureCollection',
          features: data.map((country = {}) => {
            const { countryInfo = {} } = country;
            const { lat, long: lng } = countryInfo;
            return {
              type: 'Feature',
              properties: {
              ...country,
              },
              geometry: {
                type: 'Point',
                coordinates: [ lng, lat ]
              }
            }
          })
        }
    
        console.log(JSON.stringify(geoJson));
    
        const geoJsonLayers = new L.GeoJSON(geoJson, {
          pointToLayer: (feature = {}, latlng) => {
            const { properties = {} } = feature;
            let updatedFormatted;
            let casesString;
        
            const {
              country,
              updated,
              cases,
              deaths,
              recovered
            } = properties
        
            casesString = `${cases}`;
        
            if ( cases > 1000 ) {
              casesString = `${casesString.slice(0, -3)}k+`
            }
        
            if ( updated ) {
              updatedFormatted = new Date(updated).toLocaleString();
            }
        
            const html = `
              <span class="icon-marker">
                <span class="icon-marker-tooltip">
                  <h2>${country}</h2>
                  <ul>
                    <li><strong>Confirmed:</strong> ${cases}</li>
                    <li><strong>Deaths:</strong> ${deaths}</li>
                    <li><strong>Recovered:</strong> ${recovered}</li>
                    <li><strong>Last Update:</strong> ${updatedFormatted}</li>
                  </ul>
                </span>
                ${ casesString }
              </span>
            `;
        
            return L.marker( latlng, {
              icon: L.divIcon({
                className: 'icon',
                html
              }),
              riseOnHover: true
            });
          }
        });
    
        geoJsonLayers.addTo(map);
      })();
    }, [map, markerRef]);
  
    return null;
  };

const IndexPage = () => {
  const markerRef = useRef();
  console.log("useRef");
  console.log(markerRef);

  const mapSettings = {
    center: CENTER,
    defaultBaseMap: 'OpenStreetMap',
    zoom: DEFAULT_ZOOM
  };

  return (
    <Layout pageName="home">
      <Helmet>
        <title>Home Page</title>
      </Helmet>

      <Map {...mapSettings} >
        <MapEffect markerRef={markerRef} />
      </Map>

      <Container type="content" className="text-center home-start">
        <h2>Still Getting Started?</h2>
        <p>Run the following in your terminal!</p>
        <pre>
          <code>gatsby new [directory] https://github.com/colbyfayock/gatsby-starter-leaflet</code>
        </pre>
        <p className="note">Note: Gatsby CLI required globally for the above command</p>
      </Container>
    </Layout>
  );
};

export default IndexPage;