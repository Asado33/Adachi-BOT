import lodash from "lodash";
import path from "path";
import { checkAuth } from "#utils/auth";
import { getCache } from "#utils/cache";
import db from "#utils/database";

const running = { mysNewsNotice: false };

function initDB() {
  for (const t of ["announcement", "event", "information"]) {
    if (!db.includes("news", "timestamp", { type: t })) {
      db.push("news", "timestamp", { type: t, time: 0 });
    }
  }
}

async function mysNewsNotice(withImg = true) {
  if (1 !== global.config.noticeMysNews) {
    return;
  }

  if (true === running.mysNewsNotice) {
    return;
  }

  // XXX currently no return before set this false
  running.mysNewsNotice = true;

  initDB();

  const cacheDir = path.resolve(global.rootdir, "data", "image", "news");
  const data = db.get("news", "data");

  for (const t of Object.keys(data)) {
    if (!lodash.hasIn(data[t], "data.list") || !Array.isArray(data[t].data.list)) {
      continue;
    }

    const news = data[t].data.list;

    for (const n of lodash.sortBy(news, (c) => c.post.created_at)) {
      if (!lodash.hasIn(n, "post")) {
        continue;
      }

      const timestamp = db.get("news", "timestamp");
      let lastTimeStamp = (timestamp.find((c) => t === c.type) || {}).time || 0;
      const silent = 0 === lastTimeStamp;
      const post = n.post || {};
      const { subject, content } = post;
      let image;

      if (true === withImg && "string" === typeof post.images[0]) {
        try {
          image = await getCache(post.images[0], cacheDir, "base64");
        } catch (e) {
          // do nothing
        }
      }

      const imageCQ = undefined !== image ? `[CQ:image,type=image,file=base64://${image}]` : "";
      const url = "string" === typeof post.post_id ? `https://bbs.mihoyo.com/ys/article/${post.post_id}` : "";
      const items = [
        "string" === typeof subject ? subject : "",
        imageCQ,
        "string" === typeof content
          ? "。！？～~".split("").includes(content[content.length - 1])
            ? content
            : `${content} ……`
          : "",
        url,
      ];
      const stamp = post.created_at || 0;

      // 立即写入，忽略所有的发送失败
      db.update("news", "timestamp", { type: t }, { time: Math.max(stamp, lastTimeStamp) });

      if (false === silent && stamp > lastTimeStamp && lodash.some(items, (c) => "string" === typeof c && "" !== c)) {
        const message = items.filter((c) => "string" === typeof c && "" !== c).join("\n");

        for (const bot of global.bots) {
          const ms = bot.boardcast(
            message,
            "group",
            (c) => false !== checkAuth({ sid: c.group_id }, global.innerAuthName.mysNews, false)
          );
          await new Promise((resolve) => setTimeout(resolve, ms));
        }
      }
    }
  }

  running.mysNewsNotice = false;
}

export { mysNewsNotice };
