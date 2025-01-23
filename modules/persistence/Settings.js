const os = require("os");
const { globalShortcut, clipboard } = require('electron');
const fs = require("fs").promises;

class Settings {
    constructor(
        paths, env, outputFormat, audioOutputFormat, downloadPath,
        proxy, rateLimit, autoFillClipboard, noPlaylist, globalShortcut, userAgent,
        validateCertificate, enableEncoding, taskList, nameFormat, nameFormatMode,
        sizeMode, splitMode, maxConcurrent, retries, fileAccessRetries, updateBinary, downloadType, updateApplication, cookiePath,
        statSend, sponsorblockMark, sponsorblockRemove, sponsorblockApi, downloadMetadata, downloadJsonMetadata,
        downloadThumbnail, keepUnmerged, avoidFailingToSaveDuplicateFileName, allowUnsafeFileExtensions, calculateTotalSize, theme
    ) {
        this.paths = paths;
        this.env = env
        this.outputFormat = outputFormat == null ? "none" : outputFormat;
        this.audioOutputFormat = audioOutputFormat == null ? "none" : audioOutputFormat;
        this.downloadPath = downloadPath == null ? env.app.getPath("downloads") : downloadPath;
        this.proxy = proxy == null ? "" : proxy;
        this.rateLimit = rateLimit == null ? "" : rateLimit;
        this.autoFillClipboard = autoFillClipboard == null ? true : autoFillClipboard;
        this.noPlaylist = noPlaylist == null ? false : noPlaylist;
        this.globalShortcut = globalShortcut == null ? true : globalShortcut;
        this.userAgent = userAgent == null ? "spoof" : userAgent;
        this.validateCertificate = validateCertificate == null ? false : validateCertificate;
        this.enableEncoding = enableEncoding == null ? false : enableEncoding;
        this.taskList = taskList == null ? true : taskList;
        this.nameFormat = nameFormat == null ? "%(title).200s-(%(height)sp%(fps).0d).%(ext)s" : nameFormat;
        this.nameFormatMode = nameFormatMode == null ? "%(title).200s-(%(height)sp%(fps).0d).%(ext)s" : nameFormatMode;
        this.sponsorblockMark = sponsorblockMark == null ? "" : sponsorblockMark;
        this.sponsorblockRemove = sponsorblockRemove == null ? "" : sponsorblockRemove;
        this.sponsorblockApi = sponsorblockApi == null ? "https://sponsor.ajay.app" : sponsorblockApi;
        this.downloadMetadata = downloadMetadata == null ? true : downloadMetadata;
        this.downloadJsonMetadata = downloadJsonMetadata == null ? false : downloadJsonMetadata;
        this.downloadThumbnail = downloadThumbnail == null ? false : downloadThumbnail;
        this.keepUnmerged = keepUnmerged == null ? false : keepUnmerged;
        this.avoidFailingToSaveDuplicateFileName = avoidFailingToSaveDuplicateFileName == null ? false : avoidFailingToSaveDuplicateFileName;
        this.allowUnsafeFileExtensions = allowUnsafeFileExtensions == null ? false : allowUnsafeFileExtensions;
        this.calculateTotalSize = calculateTotalSize == null ? true : calculateTotalSize;
        this.sizeMode = sizeMode == null ? "click" : sizeMode;
        this.splitMode = splitMode == null? "49" : splitMode;
        this.maxConcurrent = (maxConcurrent == null || maxConcurrent <= 0) ? this.getDefaultMaxConcurrent() : maxConcurrent; //Max concurrent is standard half of the system's available cores
        this.retries = retries || 10;
        this.fileAccessRetries = fileAccessRetries || 3;
        this.updateBinary = updateBinary == null ? true : updateBinary;
        this.downloadType = downloadType == null ? "video" : downloadType;
        this.updateApplication = updateApplication == null ? true : updateApplication;
        this.cookiePath = cookiePath;
        this.statSend = statSend == null ? false : statSend;
        this.theme = theme == null ? "dark" : theme;
        this.setGlobalShortcuts();
        this.mitmPort = 15930;
        this.mitmExtraArgs = "--anticache --anticomp --mode socks5";
        this.headerFilter = ["if-range", "if-none-match", "if-modified-since", "if-match", "if-unmodified-since", "sec-ch-ua"];
    }

    setupMitmproxyConfig(mitmPort, mitmExtraArgs, headerFilter) {
        this.mitmPort = mitmPort == null ? 15930 :mitmPort;
        this.mitmExtraArgs = mitmExtraArgs == null ? "--anticache --anticomp --mode socks5" :mitmExtraArgs;
        this.headerFilter = headerFilter == null ? ["if-range", "if-none-match", "if-modified-since", "if-match", "if-unmodified-since", "sec-ch-ua"] : headerFilter;
    }

    getDefaultMaxConcurrent() {
        let halfOfCpus = Math.round(os.cpus().length / 2);

        //When os.cpus() returns an empty list, default to 4
        if (halfOfCpus <= 0) {
            halfOfCpus = 4;
        }

        return halfOfCpus;
    }

    static async loadFromFile(paths, env) {
        try {
            let result = await fs.readFile(paths.settings, "utf8");
            let data = JSON.parse(result);
            let settings= new Settings(
                paths,
                env,
                data.outputFormat,
                data.audioOutputFormat,
                data.downloadPath,
                data.proxy,
                data.rateLimit,
                data.autoFillClipboard,
                data.noPlaylist,
                data.globalShortcut,
                data.userAgent,
                data.validateCertificate,
                data.enableEncoding,
                data.taskList,
                data.nameFormat,
                data.nameFormatMode,
                data.sizeMode,
                data.splitMode,
                data.maxConcurrent,
                data.retries,
                data.fileAccessRetries,
                data.updateBinary,
                data.downloadType,
                data.updateApplication,
                data.cookiePath,
                data.statSend,
                data.sponsorblockMark,
                data.sponsorblockRemove,
                data.sponsorblockApi,
                data.downloadMetadata,
                data.downloadJsonMetadata,
                data.downloadThumbnail,
                data.keepUnmerged,
                data.avoidFailingToSaveDuplicateFileName,
                data.allowUnsafeFileExtensions,
                data.calculateTotalSize,
                data.theme
            );
            settings.setupMitmproxyConfig(
                data.mitmPort,
                data.mitmExtraArgs,
                data.headerFilter
            );
            return settings;
        } catch(err) {
            console.log(err);
            let settings = new Settings(paths, env);
            settings.setupMitmproxyConfig();
            settings.save();
            console.log("Created new settings file.")
            return settings;
        }
    }

    update(settings) {
        this.outputFormat = settings.outputFormat;
        this.audioOutputFormat = settings.audioOutputFormat;
        this.proxy = settings.proxy;
        this.rateLimit = settings.rateLimit;
        this.autoFillClipboard = settings.autoFillClipboard;
        this.noPlaylist = settings.noPlaylist;
        this.globalShortcut = settings.globalShortcut;
        this.userAgent = settings.userAgent;
        this.validateCertificate = settings.validateCertificate;
        this.enableEncoding = settings.enableEncoding;
        this.taskList = settings.taskList;
        this.nameFormat = settings.nameFormat;
        this.nameFormatMode = settings.nameFormatMode;
        this.sponsorblockMark = settings.sponsorblockMark;
        this.sponsorblockRemove = settings.sponsorblockRemove;
        this.sponsorblockApi = settings.sponsorblockApi;
        this.downloadMetadata = settings.downloadMetadata;
        this.downloadJsonMetadata = settings.downloadJsonMetadata;
        this.downloadThumbnail = settings.downloadThumbnail;
        this.keepUnmerged = settings.keepUnmerged;
        this.avoidFailingToSaveDuplicateFileName = settings.avoidFailingToSaveDuplicateFileName;
        this.allowUnsafeFileExtensions = settings.allowUnsafeFileExtensions;
        this.mitmPort = settings.mitmPort;
        this.mitmExtraArgs = settings.mitmExtraArgs;
        this.headerFilter = settings.headerFilter;
        this.calculateTotalSize = settings.calculateTotalSize;
        this.sizeMode = settings.sizeMode;
        this.splitMode = settings.splitMode;
        if(this.maxConcurrent !== settings.maxConcurrent) {
            this.maxConcurrent = settings.maxConcurrent;
            this.env.changeMaxConcurrent(settings.maxConcurrent);
        }
        this.retries = settings.retries;
        this.fileAccessRetries = settings.fileAccessRetries;
        this.updateBinary = settings.updateBinary;
        this.downloadType = settings.downloadType;
        this.updateApplication = settings.updateApplication;
        this.theme = settings.theme;
        this.save();

        //Prevent installing already downloaded updates on app close.
        this.env.appUpdater.setUpdateSetting(settings.updateApplication);
        this.setGlobalShortcuts();
    }

    serialize() {
        return {
            outputFormat: this.outputFormat,
            audioOutputFormat: this.audioOutputFormat,
            downloadPath: this.downloadPath,
            proxy: this.proxy,
            rateLimit: this.rateLimit,
            autoFillClipboard: this.autoFillClipboard,
            noPlaylist: this.noPlaylist,
            globalShortcut: this.globalShortcut,
            userAgent: this.userAgent,
            validateCertificate: this.validateCertificate,
            enableEncoding: this.enableEncoding,
            taskList: this.taskList,
            nameFormat: this.nameFormat,
            nameFormatMode: this.nameFormatMode,
            sizeMode: this.sizeMode,
            splitMode: this.splitMode,
            maxConcurrent: this.maxConcurrent,
            retries: this.retries,
            fileAccessRetries: this.fileAccessRetries,
            defaultConcurrent: this.getDefaultMaxConcurrent(),
            updateBinary: this.updateBinary,
            downloadType: this.downloadType,
            updateApplication: this.updateApplication,
            cookiePath: this.cookiePath,
            statSend: this.statSend,
            sponsorblockMark: this.sponsorblockMark,
            sponsorblockRemove: this.sponsorblockRemove,
            sponsorblockApi: this.sponsorblockApi,
            downloadMetadata: this.downloadMetadata,
            downloadJsonMetadata: this.downloadJsonMetadata,
            downloadThumbnail: this.downloadThumbnail,
            keepUnmerged: this.keepUnmerged,
            avoidFailingToSaveDuplicateFileName: this.avoidFailingToSaveDuplicateFileName,
            allowUnsafeFileExtensions: this.allowUnsafeFileExtensions,
            mitmPort: this.mitmPort,
            mitmExtraArgs: this.mitmExtraArgs,
            headerFilter: this.headerFilter,
            calculateTotalSize: this.calculateTotalSize,
            theme: this.theme,
            version: this.env.version
        }
    }

    save() {
        fs.writeFile(this.paths.settings, JSON.stringify(this.serialize()), "utf8").then(() => {
            console.log("Saved settings file.")
        });
    }

    setGlobalShortcuts() {
        if(globalShortcut == null) return;
        if(!this.globalShortcut) {
            globalShortcut.unregisterAll();
        } else {
            if(!globalShortcut.isRegistered("Shift+CommandOrControl+V")) {
                globalShortcut.register('Shift+CommandOrControl+V', async () => {
                    this.env.win.webContents.send("addShortcut", clipboard.readText());
                });
            }
            if(!globalShortcut.isRegistered("Shift+CommandOrControl+D")) {
                globalShortcut.register('Shift+CommandOrControl+D', async () => {
                    this.env.win.webContents.send("downloadShortcut");
                });
            }
        }
    }
}

module.exports = Settings;
