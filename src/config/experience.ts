/**
 * Public, non-personal defaults for the open-source template.
 *
 * Customizers normally edit this file first, then replace the route and
 * checkpoint data in `story.ts`. Optional media stays disabled until the
 * matching files have been added under `public/custom/`.
 */
export const experienceConfig = {
  recipientName: "探索者",
  deliveryLabel: "PRIVATE DELIVERY · TO THE EXPLORER",
  publicDemo: {
    // Keep this on in the open-source template so first-time visitors can
    // preview the whole journey without travelling to the example locations.
    // Turn it off for the recipient-facing private deployment.
    enabled: true,
  },
  chapter: {
    from: "PAST",
    to: "NEXT",
    transition: "PAST → NEXT",
    lastPage: "THE LAST PAGE OF THE PAST",
  },
  opening: {
    lead: "今天，是一位探索者的魔法入学日。",
    lines: [
      "杭州这座城市，正在因为你而暗潮涌动。",
      "在不知名的某处地方，将翻转出特殊的惊喜。",
    ],
    edition: "CUSTOM BIRTHDAY EDITION",
  },
  finale: {
    transition: "THE PAST HAS BEEN KEPT · A NEW CHAPTER BEGINS",
    lines: [
      "过去一岁的故事，已经被好好收藏。",
      "现在，请翻开新一岁的第一章，今年的主题是探索。",
      "无论走到哪里，都愿你保有发现世界的好奇与被爱包围的勇气。",
    ],
    signature: "Happy Birthday, Explorer.",
    continueLabel: "翻开新一岁的第一章",
  },
  optionalMedia: {
    introFilm: {
      enabled: false,
      src: "/custom/intro-film.mp4",
      poster: "/custom/intro-film-poster.jpg",
      lastFrame: "/custom/intro-film-last-frame.jpg",
      deliveryLabel: "PRIVATE DELIVERY · BIRTHDAY EXPLORATION",
    },
    backgroundMusic: {
      enabled: false,
      src: "/custom/background-music.mp3",
      volume: 0.48,
    },
  },
  cartographer: {
    enabled: true,
    // This is an event fallback, not a security boundary: static-site visitors
    // can inspect bundled source. Change it for each private deployment.
    pin: "2468",
  },
} as const;
