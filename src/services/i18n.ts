export type Language = 'uz' | 'en';

export const translations = {
  uz: {
    appTitle: "SoundSync Hub",
    appSubtitle: "PC dan Telefonga Wi-Fi & Bluetooth Audio Uzatgich",
    
    // Roles
    pcMode: "Kompyuter (PC / Host)",
    phoneMode: "Telefon (Masofaviy pult & Qabul qiluvchi)",
    selectRole: "Qurilma rejimini tanlang:",
    changeDevice: "Rejimni almashtirish",

    // Wi-Fi Pairing
    roomCode: "Ulanish kodi (PIN)",
    scanQr: "Telefon kamerasi orqali QR kodni skanerlang",
    wifiTip: "Eslatma: Telefon va Kompyuter bitta Wi-Fi tarmog'iga ulangan bo'lishi lozim.",
    enterCode: "4 xonali kodni kiriting",
    connectBtn: "Ulanish",
    connecting: "Ulanmoqda...",
    connected: "Ulangan",
    disconnected: "Uzilgan",
    connectedClients: "Ulangan telefonlar",
    noClients: "Hozircha telefon ulanmagan. QR kodni skanerlang yoki PIN kodni kiriting.",

    // Audio Streaming
    streamAudio: "YouTube / Tizim Ovozini Telefonga Uzatish (Tab Capture)",
    streamingActive: "Jonli ovoz uzatilmoqda",
    stopStream: "Ovoz uzatishni to'xtatish",
    streamHelp: "Tugmani bosgach, ochilgan oynada YouTube qo'shig'i chalinayotgan brauzer sahifasini yoki ekranni tanlang va 'Ovozni ulashish' (Share Audio) belgisini yoqing.",
    audioNotice: "Kompyuterda YouTube yoki istalgan musiqani qo'ying — ovoz darhol telefonga uzatiladi va ulangan Bluetooth quloqchinda yangraydi!",
    testTone: "Sinov musiqasini eshitish (Test Synth)",
    
    // Alternative Stream Methods
    openInNewTab: "Alohida oynada ochish (Tavsiya)",
    iframeWarning: "Brauzer cheklovi: Ichki oynada (iframe) tizim ovozini ushlash taqiqlangan. Tizim ovozini to'liq uzatish uchun ilovani alohida yangi oynada oching yoki Stereo Mix / Audio fayldan foydalaning.",
    micStream: "Stereo Mix / Mikrofon orqali uzatish",
    uploadAudio: "Audio fayl (.mp3, .wav) yuklab uzatish",
    micDesc: "Windows Stereo Mix yoki mikrofon orqali kompyuterdagi YouTube tovushini telefonga uzating.",
    policyErrorTitle: "Ekran ovozini tutish uchun alohida oynada oching",
    policyErrorDesc: "Brauzer xavfsizlik siyosati (Permissions Policy) iframe ichida 'getDisplayMedia' funksiyasini cheklagan. Ilovani bitta tugma bilan yangi alohida oynada ochsangiz, YouTube tabini bemalol uzata olasiz!",

    // Volume & Sound Control
    volumeControl: "Tovushni boshqarish",
    masterVolume: "Asosiy tovush",
    boost150: "150% Kuchaytirish (Boost)",
    mute: "Ovozsiz",
    unmute: "Ovozni yoqish",
    presetLevels: "Tezkor darajalar",

    // Screen Keep Awake ("Ekran o'chmasin")
    screenAwake: "Ekran o'chmasin",
    awakeActive: "Faol: Ekran o'chmaydi",
    awakeInactive: "O'chirilgan",
    awakeDesc: "Telefon ekrani o'chib qolmasligi va musiqa uzluksiz yangrashi uchun ekranni doimiy yoniq saqlash.",

    // Bluetooth
    bluetoothTitle: "Bluetooth Ulanish",
    bluetoothConnect: "Bluetooth Quloqchin / Dinamikni ulash",
    bluetoothConnected: "Bluetooth ulangan",
    bluetoothGuideBtn: "Bluetooth Qo'llanma",
    bluetoothHint: "Telefoningizga Bluetooth quloqchin (AirPods, Galaxy Buds va b.) ulang — kompyuterdagi YouTube ovozi to'g'ridan-to'g'ri quloqchiningizga boradi!",

    // YouTube Sync & Remote
    youtubeRemote: "YouTube Boshqaruvi",
    searchOrUrl: "YouTube havola (link) yoki qo'shiq nomi...",
    playNow: "Ijro etish",
    trendingUz: "Ommabop musiqalar",
    play: "Ijro",
    pause: "Pauza",
    skip10: "10s oldinga",
    back10: "10s orqaga",
    
    // Equalizer
    equalizer: "Ekvalayzer (EQ)",
    eqBalanced: "Balanslangan",
    eqBass: "Bass Boost (+6dB)",
    eqVocal: "Vokal va so'zlar",
    eqTreble: "Tiniq baland ovoz",
    
    // Latency & Network
    latency: "Kechikish (Ping)",
    veryLow: "Juda past (<30ms)",
  },

  en: {
    appTitle: "SoundSync Hub",
    appSubtitle: "PC to Phone Wi-Fi & Bluetooth Audio Relay",
    
    // Roles
    pcMode: "Computer (PC / Host)",
    phoneMode: "Phone (Remote & Receiver)",
    selectRole: "Select Device Mode:",
    changeDevice: "Switch Mode",

    // Wi-Fi Pairing
    roomCode: "Pairing PIN Code",
    scanQr: "Scan QR code with your phone camera",
    wifiTip: "Note: Phone and PC must be connected to the same Wi-Fi or local network.",
    enterCode: "Enter 4-digit code",
    connectBtn: "Connect",
    connecting: "Connecting...",
    connected: "Connected",
    disconnected: "Disconnected",
    connectedClients: "Connected Phones",
    noClients: "No phone connected yet. Scan QR code or enter PIN code.",

    // Audio Streaming
    streamAudio: "Stream YouTube / PC Audio to Phone (Tab Capture)",
    streamingActive: "Live Audio Streaming Active",
    stopStream: "Stop Streaming",
    streamHelp: "Click the button, then select your YouTube browser tab or Screen and ensure 'Share Audio' is checked.",
    audioNotice: "Play YouTube or any music on your PC — audio immediately streams to your phone and plays via connected Bluetooth earbuds!",
    testTone: "Play Test Synth Tone",

    // Alternative Stream Methods
    openInNewTab: "Open in Standalone Tab (Recommended)",
    iframeWarning: "Browser restriction: Display audio capture is blocked inside nested iframes. To capture PC system/YouTube audio directly, open this app in a standalone tab or use Stereo Mix / Audio file streaming.",
    micStream: "Stream via Stereo Mix / Microphone",
    uploadAudio: "Stream PC Audio File (.mp3, .wav)",
    micDesc: "Stream YouTube and PC sound via Windows Stereo Mix or microphone input.",
    policyErrorTitle: "Open in Standalone Tab for Audio Capture",
    policyErrorDesc: "Browser permissions policy restricts 'display-capture' inside preview iframes. Click below to open in a clean browser tab where YouTube tab capture is fully permitted!",

    // Volume & Sound Control
    volumeControl: "Volume Control",
    masterVolume: "Master Volume",
    boost150: "150% Boost",
    mute: "Mute",
    unmute: "Unmute",
    presetLevels: "Quick Presets",

    // Screen Keep Awake
    screenAwake: "Screen Keep-Awake",
    awakeActive: "Active: Screen Stays On",
    awakeInactive: "Disabled",
    awakeDesc: "Prevents your phone screen from sleeping so audio plays continuously without interruption.",

    // Bluetooth
    bluetoothTitle: "Bluetooth Connection",
    bluetoothConnect: "Pair Bluetooth Headphones / Speaker",
    bluetoothConnected: "Bluetooth Connected",
    bluetoothGuideBtn: "Bluetooth Guide",
    bluetoothHint: "Pair your Bluetooth earbuds (AirPods, Galaxy Buds, etc.) with your phone — PC YouTube audio outputs right into your ears!",

    // YouTube Sync & Remote
    youtubeRemote: "YouTube Remote",
    searchOrUrl: "YouTube link or song name...",
    playNow: "Play Now",
    trendingUz: "Popular Tracks",
    play: "Play",
    pause: "Pause",
    skip10: "10s forward",
    back10: "10s backward",
    
    // Equalizer
    equalizer: "Equalizer (EQ)",
    eqBalanced: "Balanced",
    eqBass: "Bass Boost (+6dB)",
    eqVocal: "Crisp Vocal",
    eqTreble: "High Treble",
    
    // Latency & Network
    latency: "Latency (Ping)",
    veryLow: "Ultra-low (<30ms)",
  }
};
