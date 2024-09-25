const fs = require("fs");
const os = require("os");
const path = require("path");
const Koa = require("koa");
const Router = require("@koa/router");
const bodyParser = require("koa-bodyparser");

const config = {
  port: process.env.PORT || 30000,
  ntfyServer: process.env.NTFY_SERVER_ADDRESS || "http://localhost:30001",
  ntfyToken: process.env.NTFY_TOKEN || undefined,
  ntfyTopic: process.env.NTFY_TOPIC || undefined,
  tempFolderPath: undefined,
};

if (!config.ntfyTopic) throw new Error("Topic is undefined");
if (!config.ntfyToken) throw new Error("Token is undefined");

fs.mkdtemp(
  path.join(os.tmpdir(), "ntfy_alertmanager_bridge"),
  (err, folder) => {
    if (err) throw err;
    console.log("created temp folder: " + folder);
    config.tempFolderPath = folder;
  },
);

const app = new Koa();
app.use(bodyParser());
const router = new Router();

function logIncomingRequest(ctx) {
  const incoming = {
    url: ctx.URL,
    headers: ctx.headers,
    body: ctx.request.body,
  };
  const serialized = JSON.stringify(incoming, null, 2);
  const now = new Date();
  const logFileName = path.join(
    config.tempFolderPath,
    `req-${now.getFullYear()}-${now.getMonth() + 1
    }-${now.getDate()}T${now.getHours()}-${now.getMinutes()}-${now.getSeconds()}.log`,
  );
  fs.writeFileSync(logFileName, serialized);
}

router
  .get("/", (ctx, next) => {
    ctx.body = "hello world";
  })
  .post("/ntfy_alert", (ctx, next) => {
    logIncomingRequest(ctx);
    ctx.request.body.alerts.forEach((x) => {
      console.log(`Sending to ${config.ntfyServer}...`);
      console.log({
        "topic": config.ntfyTopic,
        "message": x.annotations.description,
        "title": x.labels.alertname,
        "tags": x.annotations.tags,
        "priority": 4,
      })

      fetch(config.ntfyServer, {
        method: "POST",
        body: JSON.stringify({
          "topic": config.ntfyTopic,
          "message": x.annotations.description,
          "title": x.labels.alertname,
          "tags": [x.annotations.tags],
          "priority": 4,
        }),
        headers: {
          "Authorization": `Bearer ${config.ntfyToken}`,
        },
      });
    });

    ctx.body = "tnx alertmanager";
  });

app.use(router.routes()).use(router.allowedMethods());
app.listen(config.port);
