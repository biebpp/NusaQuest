/**
 * NusaQuest — Dialogue Scripts & Teachable Javanese Vocabulary Data
 */

const DIALOGUES = {
  mbok_sari: {
    id: 'mbok_sari',
    name: 'Mbok Sari',
    role: 'Penjual Pasar (Market Seller)',
    charIndex: 1, // Spritesheet column 1
    lines: [
      { javanese: "Sugeng enjing, Nak!", indonesian: "Selamat pagi, Nak!" },
      { javanese: "Mundhut sayur mboten?", indonesian: "Mau beli sayur tidak?" },
      { javanese: "Reginipun sedasa ewu.", indonesian: "Harganya sepuluh ribu.", teaches: { word: "sedasa", meaning: "sepuluh (10)" } },
      { javanese: '"Pinten" niku tegese "berapa" — dadi "regine pinten?"', indonesian: '"Pinten" artinya "berapa" — jadi "harganya berapa?"', teaches: { word: "pinten", meaning: "berapa" } },
      { javanese: "Matur nuwun sampun mampir!", indonesian: "Terima kasih sudah mampir!" }
    ]
  },
  pak_joko: {
    id: 'pak_joko',
    name: 'Pak Joko',
    role: 'Petani (Farmer)',
    charIndex: 2, // Spritesheet column 2
    lines: [
      { javanese: "Sugeng rawuh ing sawah kula.", indonesian: "Selamat datang di sawah saya.", teaches: { word: "sawah", meaning: "sawah / ladang" } },
      { javanese: 'Niki namane "pari", dadi beras yen wis diolah.', indonesian: 'Ini namanya "pari", jadi beras kalau sudah diolah.', teaches: { word: "pari", meaning: "padi" } },
      { javanese: 'Pari butuh "toya" akeh supaya tuwuh subur.', indonesian: 'Padi butuh air banyak supaya tumbuh subur.', teaches: { word: "toya", meaning: "air" } },
      { javanese: "Yen wis panen, tak wenehi pari sethithik nggih!", indonesian: "Kalau sudah panen, saya kasih padi sedikit ya!" }
    ]
  },
  dimas: {
    id: 'dimas',
    name: 'Dimas',
    role: 'Bocah Desa (Village Kid)',
    charIndex: 3, // Spritesheet column 3
    lines: [
      { javanese: "Halo Kak! Pripun kabare?", indonesian: "Halo Kak! Bagaimana kabarnya?", teaches: { word: "pripun kabare", meaning: "apa kabar" } },
      { javanese: 'Yen sehat, jawabe "sae-sae mawon".', indonesian: 'Kalau sehat, jawabnya "baik-baik saja".', teaches: { word: "sae", meaning: "baik / sehat" } },
      { javanese: "Kula remen dolanan bal-balan ing kene.", indonesian: "Saya suka main bola di sini.", teaches: { word: "bal-balan", meaning: "main bola" } },
      { javanese: "Matur nuwun wis diajak omong-omong!", indonesian: "Terima kasih sudah diajak ngobrol!", teaches: { word: "matur nuwun", meaning: "terima kasih" } }
    ]
  },
  mbah_kakung: {
    id: 'mbah_kakung',
    name: 'Mbah Kakung',
    role: 'Sesepuh Joglo (Village Elder)',
    charIndex: 2, // Spritesheet column 2
    lines: [
      { javanese: "Sugeng rawuh ing balai desa, Nak.", indonesian: "Selamat datang di balai desa, Nak." },
      { javanese: "Kula mriki urip tentrem kaliyan kulawarga.", indonesian: "Saya di sini hidup tenteram bersama keluarga.", teaches: { word: "kulawarga", meaning: "keluarga" } },
      { javanese: "Mugi-mugi betah ing desa NusaQuest!", indonesian: "Semoga betah di desa NusaQuest!" }
    ]
  }
};

const TOTAL_VOCAB_COUNT = 11;
