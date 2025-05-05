"use client";

import { useRef, useState, useEffect } from "react";
import {
  GoogleMap,
  Marker,
  Autocomplete,
  useJsApiLoader,
  InfoWindow,
} from "@react-google-maps/api";
import { collection, getDocs, doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import Image from "next/image";
import { Loader2 } from "lucide-react"; // shadcn用スピナー

// 座標を指定した精度で丸める関数
function roundCoord(coord: number, precision = 4) {
  return parseFloat(coord.toFixed(precision));
}

// 投稿を位置情報でグループ化する関数
function groupPostsByLocation(posts: Post[]) {
  const map = new Map<string, Post[]>();

  posts.forEach((post) => {
    const key = `${roundCoord(post.lat)},${roundCoord(post.lng)}`;
    if (!map.has(key)) {
      map.set(key, []);
    }
    map.get(key)!.push(post);
  });

  return Array.from(map.entries()).map(([key, groupedPosts]) => ({
    key,
    lat: groupedPosts[0].lat,
    lng: groupedPosts[0].lng,
    posts: groupedPosts,
  }));
}

// 地図コンテナのスタイル設定
const containerStyle = {
  width: "100%",
  height: "100vh",
};

// 地図の初期中心座標（東京駅）
const initialCenter = {
  lat: 35.6811673,
  lng: 139.7670516,
};

export default function SimpleMap({ onPlaceSelected }: SimpleMapProps) {
  // Google Maps APIのロード
  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? "",
    libraries: ["places"],
    language: "ja",
  });

  const [map, setMap] = useState<google.maps.Map | null>(null); // Mapインスタンス
  const [markerPosition, setMarkerPosition] =
    useState<google.maps.LatLngLiteral | null>(null); // 検索で選んだ場所のマーカー位置
  const [selectedPost, setSelectedPost] = useState<GroupedPost | null>(null);
  const [loadingPosts, setLoadingPosts] = useState(true); // 投稿の読み込み状態
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null); // Autocomplete参照用
  const [userLocation, setUserLocation] =
    useState<google.maps.LatLngLiteral | null>(null); // ユーザーの現在地
  const [groupedPosts, setGroupedPosts] = useState<GroupedPost[]>([]);

  const handleLoad = (mapInstance: google.maps.Map) => {
    setMap(mapInstance);
  };

  const onAutocompleteLoad = (
    autocomplete: google.maps.places.Autocomplete
  ) => {
    autocompleteRef.current = autocomplete;
  };

  // Autocompleteで場所が選択された時
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

  // 投稿データをFirestoreから取得
  useEffect(() => {
    const fetchPosts = async () => {
      setLoadingPosts(true);
      const snapshot = await getDocs(collection(db, "posts"));
      const postsWithUserData: Post[] = [];

      for (const docSnap of snapshot.docs) {
        const postData = docSnap.data() as Post;
        const userRef = doc(db, "users", postData.uid);
        const userSnap = await getDoc(userRef);
        const userData = userSnap.exists() ? userSnap.data() : {};
        postsWithUserData.push({
          ...postData,
          postId: docSnap.id, // 投稿IDを追加
          username: userData.username || "匿名ユーザー",
          photoURL: userData.photoURL || "/default-profile.png",
        });
      }

      setGroupedPosts(groupPostsByLocation(postsWithUserData));
      setLoadingPosts(false);
    };

    fetchPosts();
  }, []);

  // ユーザーの現在地を取得して地図を移動
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const currentLoc = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };
          setUserLocation(currentLoc);
          map?.panTo(currentLoc);
        },
        (error) => {
          console.error("現在地の取得に失敗しました:", error);
          // ユーザーにエラーメッセージを表示
          if (error.code === error.PERMISSION_DENIED) {
            alert(
              "位置情報の取得が拒否されました。\n現在地は表示されませんが、地図はご利用いただけます。"
            );
          } else {
            alert(
              "位置情報の取得に失敗しました。地図はそのままご利用いただけます。"
            );
          }
        }
      );
    } else {
      console.error("Geolocation APIがサポートされていません。");
      alert("お使いのブラウザでは位置情報の取得がサポートされていません。");
    }
  }, [map]);

  // Google Mapsがまだ読み込まれていない場合のローディング表示
  if (!isLoaded) {
    return (
      <div className="w-full h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
      </div>
    );
  }

  return (
    <div className="w-full h-full absolute top-0 left-0 z-0">
      {/* 検索ボックス（Autocomplete） */}
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

      {/* 投稿読み込み中のスピナー */}
      {loadingPosts && (
        <div className="absolute top-24 left-1/2 transform -translate-x-1/2 z-10">
          <Loader2 className="h-5 w-5 animate-spin text-gray-500" />
        </div>
      )}

      {/* 地図本体 */}
      <GoogleMap
        mapContainerStyle={containerStyle}
        center={initialCenter}
        zoom={15}
        onLoad={handleLoad}
        options={{
          cameraControl: false,
          zoomControl: false,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: false, // 全画面表示ボタンを非表示
        }}
      >
        {/* 現在地マーカー（青丸） */}
        {userLocation && (
          <Marker
            position={userLocation}
            icon={{
              url:
                "data:image/svg+xml;charset=UTF-8," +
                encodeURIComponent(`
        <svg width="24" height="24" xmlns="http://www.w3.org/2000/svg">
          <circle cx="12" cy="12" r="12" fill="#4285F4" fill-opacity="0.8"/>
          <circle cx="12" cy="12" r="5" fill="#ffffff" fill-opacity="1"/>
        </svg>
      `),
              scaledSize: new window.google.maps.Size(24, 24),
              anchor: new window.google.maps.Point(12, 12),
            }}
            zIndex={999}
          />
        )}

        {/* 検索で選択した場所 */}
        {markerPosition && (
          <Marker
            position={markerPosition}
            icon={{
              url: "http://maps.google.com/mapfiles/ms/icons/blue-dot.png",
            }}
          />
        )}

        {/* グループ化された投稿マーカー */}
        {groupedPosts.map((group) => (
          <Marker
            key={group.key}
            position={{ lat: group.lat, lng: group.lng }}
            onClick={() => setSelectedPost(group)}
            icon={{
              url: "http://maps.google.com/mapfiles/ms/icons/orange-dot.png",
            }}
          />
        ))}

        {/* 吹き出しで複数投稿表示 */}
        {selectedPost && (
          <InfoWindow
            position={{ lat: selectedPost.lat, lng: selectedPost.lng }}
            onCloseClick={() => setSelectedPost(null)}
          >
            <div className="max-w-xs space-y-3">
              {selectedPost.posts.map((post, i) => (
                <div key={i} className="flex space-x-3 border-b pb-2">
                  {/* 左側：プロフィール画像とアカウント名 */}
                  <div className="flex flex-col items-center">
                    <div className="relative w-10 h-10 rounded-full overflow-hidden">
                      <Image
                        src={post.photoURL}
                        alt="プロフィール画像"
                        fill
                        className="object-cover"
                      />
                    </div>
                    <span className="text-sm text-gray-700 mt-1">
                      {post.username}
                    </span>
                  </div>

                  {/* 右側：投稿情報 */}
                  <div className="flex-1">
                    <h3 className="font-bold">{post.title}</h3>
                    <p className="text-sm text-gray-600">
                      {post.date} {post.startTime}〜{post.endTime}
                    </p>
                    <a
                      href={`/post-detail?id=${encodeURIComponent(
                        post.postId
                      )}`}
                      className="text-blue-500 text-sm underline mt-1 inline-block"
                    >
                      詳細を確認
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </InfoWindow>
        )}
      </GoogleMap>
    </div>
  );
}
interface Post {
  postId: string;
  uid: string;
  lat: number;
  lng: number;
  title: string;
  imageUrl?: string;
  date: string;
  startTime: string;
  endTime: string;
  username: string;
  photoURL: string;
}

interface GroupedPost {
  key: string;
  lat: number;
  lng: number;
  posts: Post[];
}
interface SimpleMapProps {
  onPlaceSelected?: (location: google.maps.LatLngLiteral) => void; // 場所が選ばれたときのコールバック
}
