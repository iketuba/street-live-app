// utils/categorizePosts.ts

export interface Post {
  id: string;
  title: string;
  date: string;
  startTime: string;
  endTime: string;
  price: string | number;
  uid: string;
}

export function categorizePosts(posts: Post[]) {
  const now = new Date();

  const liveNow: Post[] = [];
  const liveSoon: Post[] = [];
  const liveFuture: Post[] = [];
  const livePast: Post[] = [];

  posts.forEach((post) => {
    const start = new Date(`${post.date}T${post.startTime}`);
    const end = new Date(`${post.date}T${post.endTime}`);

    if (start <= now && end >= now) {
      liveNow.push(post);
    } else if (
      start > now &&
      start.getTime() - now.getTime() <= 3 * 60 * 60 * 1000
    ) {
      liveSoon.push(post);
    } else if (start > now) {
      liveFuture.push(post);
    } else {
      livePast.push(post);
    }
  });

  // 並び替え
  liveNow.sort(
    (a, b) =>
      new Date(`${a.date}T${a.startTime}`).getTime() -
      new Date(`${b.date}T${b.startTime}`).getTime()
  );
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

  return {
    liveNow,
    liveSoon,
    liveFuture,
    livePast,
  };
}
