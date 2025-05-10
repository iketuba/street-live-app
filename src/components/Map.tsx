"use client";

import { useRef, useState, useEffect } from "react";
import {
  GoogleMap,
  Marker,
  Autocomplete,
  useJsApiLoader,
  InfoWindow,
  OverlayView,
} from "@react-google-maps/api";
import { collection, getDocs, doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import Image from "next/image";
import { Loader2 } from "lucide-react"; // shadcn用スピナー
import { useCurrentUser } from "@/lib/hooks/useCurrentUser";
import LikeButton from "./LikeButton";

// 投稿データのインターフェース
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

// グループ化された投稿データのインターフェース
interface GroupedPost {
  key: string;
  lat: number;
  lng: number;
  posts: Post[];
}

// SimpleMapコンポーネントのプロパティインターフェース
interface SimpleMapProps {
  onPlaceSelected?: (location: google.maps.LatLngLiteral) => void; // 場所が選ばれたときのコールバック
  showStatusLabel?: boolean;
  isLocationSelect?: boolean;
}

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

export default function SimpleMap({
  onPlaceSelected,
  showStatusLabel,
  isLocationSelect,
}: SimpleMapProps) {
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
  const [groupedPosts, setGroupedPosts] = useState<GroupedPost[]>([]); // 投稿のグループ化結果
  const [showPastEvents, setShowPastEvents] = useState(!isLocationSelect); // 過去のイベントを表示するかどうか
  const currentUser = useCurrentUser();

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

      const now = new Date();
      const filteredPosts = postsWithUserData.filter((post) => {
        const postEndDate = new Date(`${post.date}T${post.endTime}`);
        return showPastEvents || postEndDate > now; // 過去の投稿を除外する
      });

      setGroupedPosts(groupPostsByLocation(filteredPosts));
      setLoadingPosts(false);
    };

    fetchPosts();
  }, [showPastEvents]);

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
      <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-10 w-11/12 max-w-md">
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
          gestureHandling: "greedy", // スワイプで地図を動かせるようにする
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
              scaledSize: new window.google.maps.Size(40, 40),
            }}
            zIndex={1}
          />
        )}

        {/* グループ化された投稿マーカー */}
        {groupedPosts.map((group) => {
          const now = new Date();
          const sortedPosts = [...group.posts].sort(
            (a, b) =>
              new Date(`${a.date}T${a.startTime}`).getTime() -
              new Date(`${b.date}T${b.startTime}`).getTime()
          );

          const first = sortedPosts[0];
          const start = new Date(`${first.date}T${first.startTime}`);
          const end = new Date(`${first.date}T${first.endTime}`);

          let statusLabel = "";
          if (start <= now && end >= now) {
            statusLabel = "ライブ中";
          } else if (
            start > now &&
            start.getTime() - now.getTime() <= 3 * 60 * 60 * 1000
          ) {
            statusLabel = "まもなくライブ";
          }

          return (
            <div key={group.key}>
              <Marker
                position={{ lat: group.lat, lng: group.lng }}
                onClick={() => setSelectedPost(group)}
                icon={{
                  url: "http://maps.google.com/mapfiles/ms/icons/orange-dot.png",
                }}
                zIndex={2}
              />

              {/* OverlayViewでラベルを表示 */}
              {showStatusLabel && statusLabel && (
                <OverlayView
                  position={{ lat: group.lat, lng: group.lng }}
                  mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET}
                >
                  <div className="animate-bounce text-red-600 text-xs font-bold px-2 py-1 rounded shadow transform -translate-y-10 whitespace-nowrap">
                    {statusLabel}
                  </div>
                </OverlayView>
              )}
            </div>
          );
        })}

        {/* 吹き出しで複数投稿表示 */}
        {selectedPost && (
          <InfoWindow
            position={{ lat: selectedPost.lat, lng: selectedPost.lng }}
            onCloseClick={() => setSelectedPost(null)}
          >
            <div className="max-w-xs space-y-3">
              {(() => {
                const now = new Date();

                // カテゴリ分け
                const liveNow: Post[] = [];
                const liveSoon: Post[] = [];
                const liveFuture: Post[] = [];
                const livePast: Post[] = [];

                selectedPost.posts.forEach((post) => {
                  const start = new Date(`${post.date}T${post.startTime}`);
                  const end = new Date(`${post.date}T${post.endTime}`);

                  if (start <= now && end >= now) {
                    liveNow.push(post);
                  } else if (
                    start > now &&
                    start.getTime() - now.getTime() <= 24 * 60 * 60 * 1000
                  ) {
                    liveSoon.push(post);
                  } else if (start > now) {
                    liveFuture.push(post);
                  } else {
                    livePast.push(post);
                  }
                });

                // 並び替え
                liveSoon.sort(
                  (a, b) =>
                    new Date(`${a.date}T${a.startTime}`).getTime() -
                    new Date(`${b.date}T${b.startTime}`).getTime()
                );
                liveFuture.sort(
                  (a, b) =>
                    new Date(`${a.date}T${a.startTime}`).getTime() -
                    new Date(`${b.date}T${b.startTime}`).getTime()
                );
                livePast.sort(
                  (a, b) =>
                    new Date(`${b.date}T${b.startTime}`).getTime() -
                    new Date(`${a.date}T${a.startTime}`).getTime()
                );

                const renderSection = (
                  title: string,
                  posts: Post[],
                  colorClass: string
                ) =>
                  posts.length > 0 && (
                    <div>
                      <h4
                        className={`text-sm font-bold mb-1 px-2 py-1 rounded ${colorClass}`}
                      >
                        {title}
                      </h4>
                      {posts.map((post, i) => (
                        <div
                          key={i}
                          className="flex space-x-3 border-b pb-2 mb-2"
                        >
                          {/* プロフィール画像と名前 */}
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

                          {/* 投稿内容 */}
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

                          {/* いいねボタン */}
                          <LikeButton
                            postId={post.postId}
                            uid={currentUser?.uid}
                          />
                        </div>
                      ))}
                    </div>
                  );

                return (
                  <>
                    {renderSection(
                      "🎤 ライブ中",
                      liveNow,
                      "bg-red-100 text-red-800"
                    )}
                    {renderSection(
                      "⏰ まもなくライブ",
                      liveSoon,
                      "bg-orange-100 text-orange-800"
                    )}
                    {renderSection(
                      "📅 今後のライブ",
                      liveFuture,
                      "bg-blue-100 text-blue-800"
                    )}
                    {renderSection(
                      "🕰️ 過去のライブ",
                      livePast,
                      "bg-gray-100 text-gray-800"
                    )}
                  </>
                );
              })()}
            </div>
          </InfoWindow>
        )}
      </GoogleMap>

      {/* チェックボックスUI */}
      {!isLocationSelect && (
        <div className="absolute bottom-20 left-4 bg-white p-2 rounded shadow z-10 flex items-center space-x-2">
          <input
            type="checkbox"
            id="showPastEvents"
            checked={showPastEvents}
            onChange={() => setShowPastEvents(!showPastEvents)}
            className="w-4 h-4"
          />
          <label htmlFor="showPastEvents" className="text-sm text-gray-700">
            過去のライブを表示
          </label>
        </div>
      )}
    </div>
  );
}
