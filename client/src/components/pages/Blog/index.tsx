import { RouteComponentProps } from "@reach/router";
import { Paper, Spinner, SubHeading } from "eri";
import { marked } from "marked";
import { useEffect, useState } from "react";
import { dateFormatter } from "../../../dateTimeFormatters";
import Version from "../../shared/Version";

const BLOG_POSTS = {
  "2021-09-24": {
    imageUrls: [new URL("2021-09-24/screenshot.png", import.meta.url)],
    title: "New feature - record your location",
    url: new URL("2021-09-24/index.md", import.meta.url),
  },
  "2021-07-17": {
    imageUrls: [new URL("2021-07-17/screenshot.png", import.meta.url)],
    title: "New feature - free meditation",
    url: new URL("2021-07-17/index.md", import.meta.url),
  },
  "2021-07-15": {
    title: "New feature - meditation stats page",
    url: new URL("2021-07-15/index.md", import.meta.url),
  },
  "2021-07-02": {
    imageUrls: [
      new URL("2021-07-02/screenshot-1.png", import.meta.url),
      new URL("2021-07-02/screenshot-2.png", import.meta.url),
    ],
    title: "New feature - meditation log",
    url: new URL("2021-07-02/index.md", import.meta.url),
  },
  "2021-04-25": {
    title: "New feature - daily statistics",
    url: new URL("2021-04-25/index.md", import.meta.url),
  },
  "2021-04-18": {
    imageUrls: [new URL("2021-04-18/screenshot.png", import.meta.url)],
    title: "New feature - meditation timer",
    url: new URL("2021-04-18/index.md", import.meta.url),
  },
  "2021-04-04": {
    imageUrls: [
      new URL("2021-04-04/screenshot-1.png", import.meta.url),
      new URL("2021-04-04/screenshot-2.png", import.meta.url),
    ],
    title: "New feature - mood gradient visualization",
    url: new URL("2021-04-04/index.md", import.meta.url),
  },
  "2021-03-18": {
    imageUrls: [new URL("2021-03-18/screenshot.png", import.meta.url)],
    title: "New feature - weekly email updates",
    url: new URL("2021-03-18/index.md", import.meta.url),
  },
  "2021-02-19": {
    imageUrls: [new URL("2021-02-19/screenshot.png", import.meta.url)],
    title: "Average mood by hour",
    url: new URL("2021-02-19/index.md", import.meta.url),
  },
  "2021-02-17": {
    title: "Improvements to the explore page",
    url: new URL("2021-02-17/index.md", import.meta.url),
  },
  "2021-01-23": {
    imageUrls: [new URL("2021-01-23/screenshot.png", import.meta.url)],
    title: "New feature - search and filter",
    url: new URL("2021-01-23/index.md", import.meta.url),
  },
  "2021-01-14": {
    imageUrls: [new URL("2021-01-14/screenshot.png", import.meta.url)],
    title: "New feature - data export",
    url: new URL("2021-01-14/index.md", import.meta.url),
  },
  "2021-01-12": {
    imageUrls: [new URL("2021-01-12/screenshot.png", import.meta.url)],
    title: "Yearly statistics and other improvements to stats",
    url: new URL("2021-01-12/index.md", import.meta.url),
  },
  "2021-01-09": {
    imageUrls: [new URL("2021-01-09/screenshot.png", import.meta.url)],
    title: "New feature - date controls on explore page",
    url: new URL("2021-01-09/index.md", import.meta.url),
  },
  "2021-01-01": {
    imageUrls: [new URL("2021-01-01/screenshot.png", import.meta.url)],
    title: "New feature - calendar view",
    url: new URL("2021-01-01/index.md", import.meta.url),
  },
  "2020-12-30": {
    imageUrls: [
      new URL("2020-12-30/screenshot-1.png", import.meta.url),
      new URL("2020-12-30/screenshot-2.png", import.meta.url),
    ],
    title: "New feature - exploration",
    url: new URL("2020-12-30/index.md", import.meta.url),
  },
} as const;

export default function Blog(_: RouteComponentProps) {
  const [posts, setPosts] = useState<
    { __html: string; dateString: string; title: string }[]
  >([]);
  useEffect(() => {
    Promise.all(
      Object.entries(BLOG_POSTS).map(async ([dateString, post]) => {
        const response = await fetch(String(post.url));
        let text = await response.text();
        if ("imageUrls" in post)
          for (const { pathname } of post.imageUrls)
            text = text.replace(
              pathname.slice(1).replace(/\..+\./, "."),
              pathname
            );
        const __html = marked.parse(text);
        return { __html, dateString, title: post.title };
      })
    ).then(setPosts);
  }, []);

  return (
    <Paper.Group>
      <Paper>
        <h2>Blog</h2>
        <p>Welcome to the MoodTracker blog!</p>
        <p>
          This space is for announcing interesting new features and
          developments. Less exciting stuff like bugfixes, performance
          improvements and minor UI changes won&apos;t get a mention here.
        </p>
        <Version />
      </Paper>
      {posts.length ? (
        posts.map(({ __html, dateString, title }) => (
          <Paper key={dateString}>
            <article itemScope itemType="http://schema.org/BlogPosting">
              <h2>
                {title}
                <SubHeading>
                  <time
                    dateTime={dateString}
                    itemProp="dateCreated datePublished pubdate"
                  >
                    {dateFormatter.format(new Date(dateString))}
                  </time>
                </SubHeading>
              </h2>
              <div dangerouslySetInnerHTML={{ __html }} />
            </article>
          </Paper>
        ))
      ) : (
        <div>
          <Spinner />
        </div>
      )}
    </Paper.Group>
  );
}
