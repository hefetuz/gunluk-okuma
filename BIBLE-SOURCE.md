# Kutsal Kitap metni

Okuyucudaki 66 kitap ve 1.189 bölüm, [Yorumsuz Türkçe Çeviri (YTC)](https://ebible.org/find/details.php?id=turytc) metninden üretilir. Telif hakkı © 2023–2025 İsmail Serinken ve eBible.org. Lisans: [CC BY-ND 4.0](https://creativecommons.org/licenses/by-nd/4.0/). Ayet sözcükleri ve noktalaması değiştirilmez. Uygulamanın günlük okuma bölümündeki Açık Lisans Temel Türkçe Tercüme İncil ayrı bir çeviridir; YTC, JW.org’un Yeni Dünya Çevirisi değildir.

Kaynak VPL dosyası `bible-source/turytc_vpl.txt`; 66 bölüm dosyası ve kitap dizini `node build-bible-data.cjs` ile yeniden üretilir. Birleştirilmiş ayet numaraları kaynaktaki gibi korunur. Metin dosyaları kitap bazında yüklenir; ziyaret edilen kitaplar servis çalışanı tarafından çevrim dışı kullanım için önbelleğe alınır.

Profil dili İngilizceye ayarlandığında okuyucu, kamu malı olan [World English Bible](https://ebible.org/find/show.php?id=engwebp) metnini gösterir. Kaynak VPL dosyası `bible-source-en/engwebp_vpl.txt`; bölüm dosyaları `bible-chapters-en` altında aynı üretim komutuyla oluşturulur.

Buluşma dil adları [JW Hub’ın kamuya açık dil kataloğundan](https://cdh.azureedge.net/assets/pattern/languages/v1/public.08d35b9e7626e07d9630e65d94e700afd7980927.js) alınan GUID eşleşmeleriyle gösterilir. `jw-languages-research.js` kaynak kopyasıdır; `jw-languages.json` aynı üretim komutuyla yenilenir. Salon ve cemaat bilgisi yine canlı JW.org sorgusundan gelir.
