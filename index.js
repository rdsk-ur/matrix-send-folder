const fs = require("fs");
const os = require("os");
const path = require("path");
const sdk = require("matrix-js-sdk");
const archiver = require("archiver");
const uuid = require("uuid/v1");

function buildArchive(dataDir) {
  const tempPath = path.join(os.tmpdir(), `${uuid()}.zip`);
  const stream = fs.createWriteStream(tempPath);
  const archive = archiver("zip");

  return new Promise((resolve, reject) => {
    archive.on("error", err => reject(err));
    archive.pipe(stream);
    archive.directory(dataDir, false);
    archive.on("end", () => resolve(tempPath));
    archive.finalize();
  });
}

const config = JSON.parse(fs.readFileSync("config.json").toString());

const client = sdk.createClient({
  accessToken: config.token,
  baseUrl: config.baseUrl,
  userId: config.userId,
});

let syncFinished = false;

client.on("RoomMember.membership", (event, member) => {
  if (member.membership === "invite" && member.userId === client.getUserId()) {
    // got an invite, check if the user is in the whitelist
    if (config.whitelist.includes(event.getSender())) {
      client.joinRoom(member.roomId);
    }
  }
});

client.on("Room.timeline", (event, room, toStartOfTimeline) => {
  if (!syncFinished) {
    return;
  }
  if (toStartOfTimeline) {
    return;
  }
  if (event.getType() === "m.room.message" && event.getSender() !== client.getUserId()) {
    const msg = event.getContent().body.toLowerCase();
    if (msg === "get") {
      client.sendTyping(room.roomId, true);
      buildArchive(config.dataDir)
        .then((tempPath) => {
          console.log(tempPath, "is the new archive");
          client
            .uploadContent(fs.createReadStream(tempPath), {
              type: "application/zip",
              name: "wetterfrosch.zip"
            })
            .done((url) => {
              console.log("uploaded to", url);
              const content = {
                msgtype: "m.file",
                body: "Wetterfrosch Data",
                url: JSON.parse(url).content_uri,
              };
              client.sendMessage(room.roomId, content)
                .done(() => {
                  client.sendTyping(room.roomId, false);
                  // remove the temp file again
                  fs.unlink(tempPath, err => {
                    if (err) {
                      console.error("Could not remove", tempPath, err);
                    }
                  });
                });
            })
        })
        .catch(err => { throw err });
    }
  }
});

client.startClient();

client.once("sync", (state) => {
  if (state === "PREPARED") {
    syncFinished = true;
  } else {
    console.warn(`state: ${state}`);
  }
});
