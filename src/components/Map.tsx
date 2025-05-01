"use client";

import { useRef, useState, useEffect } from "react";
import {
  GoogleMap,
  Marker,
  Autocomplete,
  useJsApiLoader,
  InfoWindow,
} from "@react-google-maps/api";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import Image from "next/image";

const containerStyle = {
  width: "100%",
  height: "100vh",
};

const initialCenter = {
  lat: 35.6811673, // 東京駅
  lng: 139.7670516,
};

interface Post {
  lat: number;
  lng: number;
  title: string;
  imageUrl?: string;
  date: string;
  startTime: string;
  endTime: string;
}

interface SimpleMapProps {
  onPlaceSelected?: (location: google.maps.LatLngLiteral) => void; // 場所が選ばれたときのコールバック
}

export default function SimpleMap({ onPlaceSelected }: SimpleMapProps) {
  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? "",
    libraries: ["places"],
    language: "ja",
  });

  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [markerPosition, setMarkerPosition] =
    useState<google.maps.LatLngLiteral | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);

  const handleLoad = (mapInstance: google.maps.Map) => {
    setMap(mapInstance);
  };

  const onAutocompleteLoad = (
    autocomplete: google.maps.places.Autocomplete
  ) => {
    autocompleteRef.current = autocomplete;
  };

  const onPlaceChanged = () => {
    const place = autocompleteRef.current?.getPlace();
    if (place?.geometry?.location) {
      const location = {
        lat: place.geometry.location.lat(),
        lng: place.geometry.location.lng(),
      };
      setMarkerPosition(location);
      map?.panTo(location);
      onPlaceSelected?.(location); // 場所を親コンポーネントに通知
    }
  };

  useEffect(() => {
    const fetchPosts = async () => {
      const snapshot = await getDocs(collection(db, "posts"));
      const data = snapshot.docs.map((doc) => doc.data() as Post);
      setPosts(data);
    };
    fetchPosts();
  }, []);

  if (!isLoaded) {
    return <div>Loading map...</div>;
  }

  return (
    <div className="w-full h-full absolute top-0 left-0 z-0">
      <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-10 w-11/12 max-w-md">
        <Autocomplete
          onLoad={onAutocompleteLoad}
          onPlaceChanged={onPlaceChanged}
        >
          <input
            type="text"
            placeholder="場所を検索"
            className="w-full p-3 bg-gray-100 border-2 border-gray-700 rounded-lg shadow-lg focus:outline-none focus:ring-2 focus:ring-gray-700"
          />
        </Autocomplete>
      </div>

      <GoogleMap
        mapContainerStyle={containerStyle}
        center={initialCenter}
        zoom={15}
        onLoad={handleLoad}
        options={{
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: false, // 全画面表示ボタンを非表示
        }}
      >
        {markerPosition && <Marker position={markerPosition} />}

        {posts.map((post, index) => (
          <Marker
            key={index}
            position={{ lat: post.lat, lng: post.lng }}
            onClick={() => setSelectedPost(post)}
          />
        ))}

        {selectedPost && (
          <InfoWindow
            position={{ lat: selectedPost.lat, lng: selectedPost.lng }}
            onCloseClick={() => setSelectedPost(null)}
          >
            <div className="max-w-xs">
              <h3 className="font-bold">{selectedPost.title}</h3>
              <p>
                {selectedPost.date} {selectedPost.startTime}〜
                {selectedPost.endTime}
              </p>
              {selectedPost.imageUrl && (
                <Image
                  src={selectedPost.imageUrl}
                  alt="投稿画像"
                  width={200}
                  height={200}
                  className="rounded mt-2"
                />
              )}
            </div>
          </InfoWindow>
        )}
      </GoogleMap>
    </div>
  );
}
