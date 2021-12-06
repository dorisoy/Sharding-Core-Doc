const { config } = require("vuepress-theme-hope");

module.exports = config({
  title: "ShardingCore官方文档",
  description: "ShardingCore官方文档",
  base:'/sharding-core-doc/',
  dest: "./dist",

  head: [
    // [
    //   "script",
    //   { src: "https://cdn.jsdelivr.net/npm/react/umd/react.production.min.js" },
    // ],
    // [
    //   "script",
    //   {
    //     src: "https://cdn.jsdelivr.net/npm/react-dom/umd/react-dom.production.min.js",
    //   },
    // ],
    // ["script", { src: "https://cdn.jsdelivr.net/npm/vue/dist/vue.min.js" }],
    // [
    //   "script",
    //   { src: "https://cdn.jsdelivr.net/npm/@babel/standalone/babel.min.js" },
    // ],
  ],

  locales: {
    "/": {
      lang: "zh-CN",
        title: "ShardingCore文档",
        description: "ShardingCore文档",
    },
    "/en/": {
      lang: "en-US",
      title: "ShardingCore Document",
      description: "ShardingCore Document",
    },
  },
  themeConfig: {
    logo: "/logo.svg",
    docsDir:"docs",
    hostname: "https://vuepress-theme-hope-demo.mrhope.site",

    author: "xuejiaming",
    docsRepo: "https://github.com/xuejmnet/sharding-core-doc",
    repo: "https://github.com/xuejmnet/sharding-core",

    nav: [
      {
        text: "使用指南",
        icon: "creative",
        link: "/guide/introduce",
      },
      {
        text: "国内镜像",
        link: "https://xuejm.gitee.io/sharding-core-doc/",
        icon: "note",
      },
    ],

    sidebar: {
      "/": [
        "important",
        {
          title: "指南",
          icon: "creative",
          prefix: "guide/",
          children: ["introduce","terminology","quick-start","params-confg","auto-track"],
        },
        {
          title: "分表",
          icon: "stack",
          prefix: "sharding-table/",
          children: ["init","query","update","delete"],
        },
        {
          title: "分库",
          icon: "mysql",
          prefix: "sharding-data-source/",
          children: ["init","query","update","delete"],
        },
        {
          title: "分库且分库",
          icon: "overflow",
          prefix: "sharding-all/",
          children: ["init","query","update","delete"],
        },
        {
          title: "读写分离",
          icon: "overflow",
          prefix: "read-write/",
          children: ["configure"],
        },
        {
          title: "路由",
          icon: "creative",
          prefix: "sharding-route/",
          children: ["default-route","customer-route","manual-route"],
        },
        {
          title: "查询",
          icon: "creative",
          prefix: "query/",
          children: ["single-entity-query","multi-entity-query","group-by-query","query-in-transaction"],
        },
        {
          title: "高级",
          icon: "creative",
          prefix: "adv/",
          children: ["code-first","pagination","dynamic-table","dynamic-data-source","batch-operate","transaction","route-parse-compile-cache","connection-mode"],
        },
        "question",
        "abp",
        "unit-test-coverage",
        "benchmark"
      ],
    },

    locales: {
      "/en/": {
        nav: [
          {
            text: "Guide",
            icon: "creative",
            link: "/zh/guide/introduce",
          },
          {
            text: "Domestic Image",
            link: "https://xuejm.gitee.io/sharding-core-doc/",
            icon: "note",
          },
          // {
          //   text: "项目指南",
          //   icon: "note",
          //   link: "https://vuepress-theme-hope.github.io/zh/",
          // },
        ],
        sidebar: {
          "/en/": [
            "important",
            {
              title: "Guide",
              icon: "creative",
              prefix: "guide/",
              children: ["introduce","terminology","quick-start","params-confg","auto-track"],
            },
            {
              title: "ShardingTable",
              icon: "stack",
              prefix: "sharding-table/",
              children: ["init","query","update","delete"],
            },
            {
              title: "ShardingDataSource",
              icon: "mysql",
              prefix: "sharding-data-source/",
              children: ["init","query","update","delete"],
            },
            {
              title: "ShardingAll",
              icon: "overflow",
              prefix: "sharding-all/",
              children: ["init","query","update","delete"],
            },
            {
              title: "ReadWrite",
              icon: "overflow",
              prefix: "read-write/",
              children: ["configure"],
            },
            {
              title: "Route",
              icon: "creative",
              prefix: "sharding-route/",
              children: ["default-route","customer-route","manual-route"],
            },
            {
              title: "Query",
              icon: "creative",
              prefix: "query/",
              children: ["single-entity-query","multi-entity-query","group-by-query","query-in-transaction"],
            },
            {
              title: "Advance",
              icon: "creative",
              prefix: "adv/",
              children: ["code-first","pagination","dynamic-table","batch-operate","transaction","route-parse-compile-cache"],
            },
            "question",
            "abp",
            "unit-test-coverage",
            "benchmark"
          ],
        },
      },
    },

    blog: {
      intro: "/intro/",
      sidebarDisplay: "mobile",
      links: {
        Github: "https://github.com/xuejmnet",
      },
    },

    footer: {
      display: true,
      content: "",
    },

    // comment: {
    //   type: "waline",
    //   serverURL: "https://vuepress-theme-hope-comment.vercel.app",
    // },

    copyright: {
      status: "global",
    },

    git: {
      timezone: "Asia/Shanghai",
    },

    mdEnhance: {
      enableAll: true,
      presentation: {
        plugins: [
          "highlight",
          "math",
          "search",
          "notes",
          "zoom",
          "anything",
          "audio",
          "chalkboard",
        ],
      },
    },

    pwa: {
      favicon: "/favicon.ico",
      cachePic: true,
      apple: {
        icon: "/assets/icon/apple-icon-152.png",
        statusBarColor: "black",
      },
      msTile: {
        image: "/assets/icon/ms-icon-144.png",
        color: "#ffffff",
      },
      manifest: {
        icons: [
          {
            src: "/assets/icon/chrome-mask-512.png",
            sizes: "512x512",
            purpose: "maskable",
            type: "image/png",
          },
          {
            src: "/assets/icon/chrome-mask-192.png",
            sizes: "192x192",
            purpose: "maskable",
            type: "image/png",
          },
          {
            src: "/assets/icon/chrome-512.png",
            sizes: "512x512",
            type: "image/png",
          },
          {
            src: "/assets/icon/chrome-192.png",
            sizes: "192x192",
            type: "image/png",
          },
        ],
        shortcuts: [
          {
            name: "Guide",
            short_name: "Guide",
            url: "/guide/",
            icons: [
              {
                src: "/assets/icon/guide-maskable.png",
                sizes: "192x192",
                purpose: "maskable",
                type: "image/png",
              },
              {
                src: "/assets/icon/guide-monochrome.png",
                sizes: "192x192",
                purpose: "monochrome",
                type: "image/png",
              },
            ],
          },
        ],
      },
    },
  },
});
