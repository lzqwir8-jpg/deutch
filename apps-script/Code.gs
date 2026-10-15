/**
 * Wortschatz-Navigator — бэкенд на Google Таблице.
 *
 * Как поставить (подробно в README.md):
 *   1. Создайте пустую Google Таблицу → Расширения → Apps Script.
 *   2. Вставьте этот файл целиком вместо Code.gs, сохраните.
 *   3. Выберите функцию setup и нажмите «Выполнить» (разрешите доступ).
 *      В журнале появится КЛЮЧ — скопируйте его.
 *   4. Развернуть → Новое развертывание → Тип «Веб-приложение»,
 *      «Выполнять как: я», «Доступ: все» → Развернуть. Скопируйте URL (…/exec).
 *   5. На сайте: ⚙ Настройки → вставьте URL и ключ.
 *   Книга: положите PDF в свой Google Диск. setup() найдёт его сам; если нет —
 *   вставьте ссылку на файл на листе «Состояние» в строку «Книга (PDF в Google Диске)»
 *   и запустите setup ещё раз. Сайт берёт картинки страниц прямо из этого PDF.
 *
 * Листы:
 *   «Темы»      — все 192 темы книги, отметки «пройдено», дата, номер урока.
 *   «Уроки»     — № урока, дата, какие темы прошли, страницы, заметка.
 *   «Состояние» — где остановились и текущий номер урока.
 * Таблицу можно править руками: сайт читает её при каждом обновлении.
 */

const SHEET_TOPICS = 'Темы';
const SHEET_LESSONS = 'Уроки';
const SHEET_STATE = 'Состояние';
const TOPIC_HEAD = ['ID', 'Глава', 'Название главы', '№', 'Тема', 'Страницы', 'Уровень', 'B2+', 'Пройдено (дата)', 'Урок №', 'Кто отметил'];
const LESSON_HEAD = ['Урок №', 'Дата', 'Темы', 'Страницы', 'Заметка'];

// id, глава, название главы, №, тема, страницы, уровень, B2+
const TOPICS = [["A1", "A", "Kontakte, Informationen zur Person", 1, "Sich vorstellen", "8–9", "A2", 0],
  ["A2", "A", "Kontakte, Informationen zur Person", 2, "Begrüßen und Verabschieden", "10–11", "A2", 0],
  ["A3", "A", "Kontakte, Informationen zur Person", 3, "Erste Kontakte", "11", "A2", 0],
  ["A4", "A", "Kontakte, Informationen zur Person", 4, "Du oder Sie?", "12", "A2", 0],
  ["A5", "A", "Kontakte, Informationen zur Person", 5, "Kommunikation im Beruf", "12–13", "B1", 0],
  ["A6", "A", "Kontakte, Informationen zur Person", 6, "Beziehungen", "14", "B1", 0],
  ["A7", "A", "Kontakte, Informationen zur Person", 7, "Kontakte und Informationsaustausch", "15–17", "B1", 0],
  ["A8", "A", "Kontakte, Informationen zur Person", 8, "Sprache und Ausdruck", "18–21", "B2", 0],
  ["A9", "A", "Kontakte, Informationen zur Person", 9, "Reaktionen", "21", "B1", 0],
  ["A10", "A", "Kontakte, Informationen zur Person", 10, "Angaben zur Person", "22–24", "A2", 0],
  ["A11", "A", "Kontakte, Informationen zur Person", 11, "Kosename, Spitzname, Geburtsname …", "24–25", "B2", 1],
  ["A12", "A", "Kontakte, Informationen zur Person", 12, "Dokumente und Formulare", "25", "B2", 1],
  ["A13", "A", "Kontakte, Informationen zur Person", 13, "Von A bis Z", "26", "B2", 1],
  ["A14", "A", "Kontakte, Informationen zur Person", 14, "Länder, Leute und Sprachen", "26–29", "B1", 0],
  ["A15", "A", "Kontakte, Informationen zur Person", 15, "Kontinente", "30", "A2", 0],
  ["B1", "B", "Der Mensch", 1, "Kindheit und Jugend", "32–34", "B1", 1],
  ["B2", "B", "Der Mensch", 2, "Alter", "35", "B2", 1],
  ["B3", "B", "Der Mensch", 3, "Leben und Tod", "35–38", "B2", 1],
  ["B4", "B", "Der Mensch", 4, "Äußere Erscheinung", "38–40", "B2", 0],
  ["B5", "B", "Der Mensch", 5, "Charakter und Eigenschaften", "41–44", "B2", 0],
  ["B6", "B", "Der Mensch", 6, "Verhalten", "45–47", "B2", 0],
  ["B7", "B", "Der Mensch", 7, "Gefühle und Einstellungen", "47–49", "B2", 0],
  ["B8", "B", "Der Mensch", 8, "Denken und Wissen", "50–52", "B2", 0],
  ["B9", "B", "Der Mensch", 9, "Ethik und Moral", "52–53", "B2", 0],
  ["B10", "B", "Der Mensch", 10, "Sexualität", "53–54", "B2", 1],
  ["C1", "C", "Familie und Freunde", 1, "Familie und Verwandte", "56–57", "A2", 0],
  ["C2", "C", "Familie und Freunde", 2, "Eltern und Kinder", "57", "B1", 0],
  ["C3", "C", "Familie und Freunde", 3, "Freunde und Bekannte", "58", "B1", 0],
  ["C4", "C", "Familie und Freunde", 4, "Persönliche Beziehungen", "59", "B2", 1],
  ["C5", "C", "Familie und Freunde", 5, "Flirten", "60", "A2", 0],
  ["C6", "C", "Familie und Freunde", 6, "Emojis", "61", "B1", 1],
  ["C7", "C", "Familie und Freunde", 7, "Liebesbeziehungen", "62–63", "B2", 0],
  ["C8", "C", "Familie und Freunde", 8, "Ehe", "64", "B1", 0],
  ["C9", "C", "Familie und Freunde", 9, "Streit und Konflikte", "65", "B2", 0],
  ["C10", "C", "Familie und Freunde", 10, "Scheidung und Trennung", "66", "B2", 1],
  ["C11", "C", "Familie und Freunde", 11, "Einladungen und Verabredungen", "66–69", "B1", 0],
  ["C12", "C", "Familie und Freunde", 12, "Glückwünsche", "69–70", "A2", 0],
  ["C13", "C", "Familie und Freunde", 13, "Korrespondenz allgemein", "70", "A2", 0],
  ["D1", "D", "Körper und Körperpflege", 1, "Der Körper", "72–74", "B1", 0],
  ["D2", "D", "Körper und Körperpflege", 2, "Redewendungen rund um den Körper", "75", "B2", 1],
  ["D3", "D", "Körper und Körperpflege", 3, "Das Gesicht", "76", "A2", 0],
  ["D4", "D", "Körper und Körperpflege", 4, "Mit Augen, Ohren, Nase …", "77", "B2", 1],
  ["D5", "D", "Körper und Körperpflege", 5, "Organe", "78", "B1", 0],
  ["D6", "D", "Körper und Körperpflege", 6, "Körperteile und Organe", "78–79", "B2", 1],
  ["D7", "D", "Körper und Körperpflege", 7, "Doppelt hält besser", "79", "C1", 1],
  ["D8", "D", "Körper und Körperpflege", 8, "Vor dem Schlafengehen", "80", "A2", 0],
  ["D9", "D", "Körper und Körperpflege", 9, "Wie geht es euch?", "81", "A2", 0],
  ["D10", "D", "Körper und Körperpflege", 10, "Luisa bekommt ein Kind", "81", "B1", 1],
  ["D11", "D", "Körper und Körperpflege", 11, "Behinderungen", "82", "B1", 0],
  ["D12", "D", "Körper und Körperpflege", 12, "Körperpflege muss sein!", "83", "A2", 0],
  ["D13", "D", "Körper und Körperpflege", 13, "Beim Friseur", "84", "B1", 0],
  ["D14", "D", "Körper und Körperpflege", 14, "Rund ums Schminken", "84–86", "B1", 1],
  ["D15", "D", "Körper und Körperpflege", 15, "Körper und Bewegung", "87", "B2", 1],
  ["D16", "D", "Körper und Körperpflege", 16, "Mit Herz oder Haar?", "88", "C1", 1],
  ["E1", "E", "Gesundheit und Krankheit", 1, "Medikamente und Co.", "90", "A2", 0],
  ["E2", "E", "Gesundheit und Krankheit", 2, "Beim Hausarzt", "91–92", "B1", 0],
  ["E3", "E", "Gesundheit und Krankheit", 3, "Fachärzte", "92–94", "B1", 1],
  ["E4", "E", "Gesundheit und Krankheit", 4, "Beim Zahnarzt", "94", "B1", 1],
  ["E5", "E", "Gesundheit und Krankheit", 5, "Wortfeld Medizin", "95", "B1", 0],
  ["E6", "E", "Gesundheit und Krankheit", 6, "Im Krankenhaus", "96–97", "B1", 0],
  ["E7", "E", "Gesundheit und Krankheit", 7, "Noch mehr Medizinisches", "97", "B2", 0],
  ["E8", "E", "Gesundheit und Krankheit", 8, "Wortfamilie krank", "98", "B2", 1],
  ["E9", "E", "Gesundheit und Krankheit", 9, "Rund um den Schmerz", "99", "B2", 1],
  ["E10", "E", "Gesundheit und Krankheit", 10, "Die Packungsbeilage", "100–102", "B2", 1],
  ["E11", "E", "Gesundheit und Krankheit", 11, "Alkohol und Drogen", "103–104", "B2", 1],
  ["E12", "E", "Gesundheit und Krankheit", 12, "Rauchen", "105", "B1", 0],
  ["E13", "E", "Gesundheit und Krankheit", 13, "Gesunde Lebensweise", "106", "B1", 0],
  ["F1", "F", "Wahrnehmung und Aktivitäten", 1, "Sehen", "108–109", "B2", 0],
  ["F2", "F", "Wahrnehmung und Aktivitäten", 2, "Hören", "109–110", "B1", 0],
  ["F3", "F", "Wahrnehmung und Aktivitäten", 3, "Fühlen, schmecken, riechen …", "111", "B1", 0],
  ["F4", "F", "Wahrnehmung und Aktivitäten", 4, "Körperbewegung und Körperstellungen", "112–113", "B1", 0],
  ["F5", "F", "Wahrnehmung und Aktivitäten", 5, "Aktivitäten allgemein – ein Spottgedicht", "114–115", "B1", 0],
  ["F6", "F", "Wahrnehmung und Aktivitäten", 6, "Tätigkeiten", "115–117", "B1", 0],
  ["F7", "F", "Wahrnehmung und Aktivitäten", 7, "Geräte benutzen", "118", "B1", 0],
  ["G1", "G", "Wohnen und Hausarbeit", 1, "Rund ums Wohnen", "120–122", "B1", 0],
  ["G2", "G", "Wohnen und Hausarbeit", 2, "Wohnungsanzeigen", "123", "B1", 1],
  ["G3", "G", "Wohnen und Hausarbeit", 3, "Tipps für eine erfolgreiche Wohnungssuche", "124", "C1", 1],
  ["G4", "G", "Wohnen und Hausarbeit", 4, "Ein Haus", "125–126", "A2", 0],
  ["G5", "G", "Wohnen und Hausarbeit", 5, "Wir kaufen Möbel", "126–127", "A2", 0],
  ["G6", "G", "Wohnen und Hausarbeit", 6, "Im Wohnzimmer", "127–128", "B1", 0],
  ["G7", "G", "Wohnen und Hausarbeit", 7, "Redewendungen: Haus und Einrichtung", "128", "B2", 1],
  ["G8", "G", "Wohnen und Hausarbeit", 8, "AAL – Smarthome für Senioren", "129", "C1", 1],
  ["G9", "G", "Wohnen und Hausarbeit", 9, "Morgens im Bad", "130", "B1", 0],
  ["G10", "G", "Wohnen und Hausarbeit", 10, "In der Küche", "131–132", "A2", 0],
  ["G11", "G", "Wohnen und Hausarbeit", 11, "Weitere Einrichtungsgegenstände", "133", "B1", 1],
  ["G12", "G", "Wohnen und Hausarbeit", 12, "Elektrizität und Heizung", "134", "B1", 0],
  ["G13", "G", "Wohnen und Hausarbeit", 13, "Arbeiten im Haushalt", "135–137", "B1", 0],
  ["G14", "G", "Wohnen und Hausarbeit", 14, "Müll trennen und entsorgen", "138", "B2", 1],
  ["H1", "H", "Umwelt und Natur", 1, "Geografie und Geologie – allgemeine Begriffe", "140–141", "B2", 1],
  ["H2", "H", "Umwelt und Natur", 2, "Deutschland", "142–143", "B1", 0],
  ["H3", "H", "Umwelt und Natur", 3, "Österreich", "144–145", "B1", 0],
  ["H4", "H", "Umwelt und Natur", 4, "Die Schweiz", "145", "B1", 0],
  ["H5", "H", "Umwelt und Natur", 5, "Geologie", "146", "B2", 1],
  ["H6", "H", "Umwelt und Natur", 6, "In der Stadt", "146–148", "B1", 0],
  ["H7", "H", "Umwelt und Natur", 7, "In den Bergen", "149", "A2", 0],
  ["H8", "H", "Umwelt und Natur", 8, "Am Meer und am Fluss", "150", "B1", 0],
  ["H9", "H", "Umwelt und Natur", 9, "Pflanzen", "151–155", "B2", 0],
  ["H10", "H", "Umwelt und Natur", 10, "Landwirtschaft", "156–158", "B2", 0],
  ["H11", "H", "Umwelt und Natur", 11, "Tiere", "159–161", "B2", 0],
  ["H12", "H", "Umwelt und Natur", 12, "Redewendungen: Tiere", "162–163", "B2", 0],
  ["H13", "H", "Umwelt und Natur", 13, "Jahreszeiten, Monate, Tageszeiten", "164–166", "A2", 0],
  ["H14", "H", "Umwelt und Natur", 14, "Wetter und Klima", "166–168", "B1", 0],
  ["I1", "I", "Reisen und Verkehr", 1, "Verkehrsmittel", "170–171", "A2", 0],
  ["I2", "I", "Reisen und Verkehr", 2, "Zu Fuß unterwegs", "172", "A2", 0],
  ["I3", "I", "Reisen und Verkehr", 3, "Mit dem Auto unterwegs", "173–179", "B1", 0],
  ["I4", "I", "Reisen und Verkehr", 4, "Mit öffentlichen Verkehrsmitteln unterwegs", "180–181", "B1", 0],
  ["I5", "I", "Reisen und Verkehr", 5, "In der Touristeninformation", "182", "A2", 0],
  ["I6", "I", "Reisen und Verkehr", 6, "Mit der Bahn unterwegs", "183–184", "B1", 0],
  ["I7", "I", "Reisen und Verkehr", 7, "Redewendungen rund um den Begriff Zug", "185", "C1", 1],
  ["I8", "I", "Reisen und Verkehr", 8, "Mit dem Flugzeug unterwegs", "186–188", "B1", 0],
  ["I9", "I", "Reisen und Verkehr", 9, "Reiseplanung", "188–189", "A2", 0],
  ["I10", "I", "Reisen und Verkehr", 10, "Im Hotel", "190–191", "B1", 0],
  ["I11", "I", "Reisen und Verkehr", 11, "Mit dem Schiff unterwegs", "192", "B2", 0],
  ["I12", "I", "Reisen und Verkehr", 12, "Berufe: Tourismus, Hotel und Verkehr", "193", "B1", 1],
  ["I13", "I", "Reisen und Verkehr", 13, "Visum und Einreise", "194–195", "B2", 0],
  ["I14", "I", "Reisen und Verkehr", 14, "Wortfeld gehen", "196", "C1", 1],
  ["J1", "J", "Essen und Trinken", 1, "Obst und Gemüse", "198–199", "A2", 0],
  ["J2", "J", "Essen und Trinken", 2, "Frühstück", "199–200", "A2", 0],
  ["J3", "J", "Essen und Trinken", 3, "Getränke und Essen", "201–203", "B1", 0],
  ["J4", "J", "Essen und Trinken", 4, "Im Restaurant", "204–206", "A2", 0],
  ["J5", "J", "Essen und Trinken", 5, "Speisekarte", "207", "B1", 0],
  ["J6", "J", "Essen und Trinken", 6, "Verschiedene Gaststätten", "208–209", "B1", 0],
  ["J7", "J", "Essen und Trinken", 7, "Redewendungen: Lebensmittel", "209–210", "C1", 1],
  ["J8", "J", "Essen und Trinken", 8, "Alkohol", "211", "B2", 1],
  ["J9", "J", "Essen und Trinken", 9, "Das schmeckt mir nicht!", "212", "B1", 0],
  ["J10", "J", "Essen und Trinken", 10, "Rund ums Kochen", "213–214", "B2", 0],
  ["J11", "J", "Essen und Trinken", 11, "Portionen", "215", "A2", 0],
  ["J12", "J", "Essen und Trinken", 12, "Einladungen", "215–216", "B1", 0],
  ["J13", "J", "Essen und Trinken", 13, "Geschirr, Besteck und sonstige Haushaltsartikel", "217", "A2", 0],
  ["J14", "J", "Essen und Trinken", 14, "Wortfeld essen", "218", "C1", 1],
  ["K1", "K", "Geschäfte und Einkaufen", 1, "Geschäfte", "220–222", "A2", 0],
  ["K2", "K", "Geschäfte und Einkaufen", 2, "Einkaufen und verkaufen", "223–229", "B1", 0],
  ["K3", "K", "Geschäfte und Einkaufen", 3, "Verpackungen, Mengenangaben und Portionen", "229–230", "A2", 0],
  ["K4", "K", "Geschäfte und Einkaufen", 4, "Bezahlen", "231–232", "B1", 0],
  ["K5", "K", "Geschäfte und Einkaufen", 5, "Kleidung und Schuhe", "233–239", "B1", 0],
  ["K6", "K", "Geschäfte und Einkaufen", 6, "Schmuck und Accessoires", "240", "B2", 1],
  ["K7", "K", "Geschäfte und Einkaufen", 7, "Küchengeräte", "241", "B2", 1],
  ["K8", "K", "Geschäfte und Einkaufen", 8, "Werkzeug", "242–243", "B2", 0],
  ["K9", "K", "Geschäfte und Einkaufen", 9, "Rauchwaren", "244", "B1", 1],
  ["L1", "L", "Medien, Post, Bank, Amt, Feuerwehr und Polizei", 1, "Post, Briefe und Telefon", "246–249", "B1", 0],
  ["L2", "L", "Medien, Post, Bank, Amt, Feuerwehr und Polizei", 2, "Telefonieren, E-Mails und soziale Medien", "250–257", "B2", 0],
  ["L3", "L", "Medien, Post, Bank, Amt, Feuerwehr und Polizei", 3, "Influencer", "258", "C1", 1],
  ["L4", "L", "Medien, Post, Bank, Amt, Feuerwehr und Polizei", 4, "Bankgeschäfte und Konto", "259–264", "B2", 0],
  ["L5", "L", "Medien, Post, Bank, Amt, Feuerwehr und Polizei", 5, "Ämter, Behörden, Fundbüro", "265–267", "C1", 0],
  ["L6", "L", "Medien, Post, Bank, Amt, Feuerwehr und Polizei", 6, "Feuerwehr", "268–270", "B2", 0],
  ["L7", "L", "Medien, Post, Bank, Amt, Feuerwehr und Polizei", 7, "Polizei und Sozialdienste", "271–276", "C1", 0],
  ["M1", "M", "Schule und Studium", 1, "Das Schulwesen", "278–280", "B1", 0],
  ["M2", "M", "Schule und Studium", 2, "Schulmaterialien", "281–282", "A2", 0],
  ["M3", "M", "Schule und Studium", 3, "Unterrichtsaktivitäten", "283–286", "B1", 0],
  ["M4", "M", "Schule und Studium", 4, "Unterrichtsfächer", "287", "A2", 0],
  ["M5", "M", "Schule und Studium", 5, "Sprachen lernen", "288–291", "B1", 0],
  ["M6", "M", "Schule und Studium", 6, "Prüfungen", "291–292", "B1", 0],
  ["M7", "M", "Schule und Studium", 7, "Universität und Hochschule", "293–295", "B1", 1],
  ["M8", "M", "Schule und Studium", 8, "Redewendungen: Wort, Rede, Sprache", "295–296", "C1", 1],
  ["N1", "N", "Arbeit und Beruf", 1, "Berufsbezeichnungen", "298–300", "A2", 0],
  ["N2", "N", "Arbeit und Beruf", 2, "Arbeitsplätze", "301", "B1", 0],
  ["N3", "N", "Arbeit und Beruf", 3, "Rund um den Beruf", "302–305", "B2", 0],
  ["N4", "N", "Arbeit und Beruf", 4, "Taxifahrer Peter Maurer", "306", "A2", 0],
  ["N5", "N", "Arbeit und Beruf", 5, "Stellenanzeigen", "307–308", "B1", 0],
  ["N6", "N", "Arbeit und Beruf", 6, "Arbeitssuche und Stellenwechsel", "309", "B1", 0],
  ["N7", "N", "Arbeit und Beruf", 7, "Die Bewerbung", "310–314", "B2", 1],
  ["N8", "N", "Arbeit und Beruf", 8, "Exkurs: Briefe schreiben", "315–317", "B2", 1],
  ["N9", "N", "Arbeit und Beruf", 9, "Redewendungen rund ums Arbeiten", "318–319", "C1", 1],
  ["N10", "N", "Arbeit und Beruf", 10, "Terminplanung", "319–320", "A2", 0],
  ["N11", "N", "Arbeit und Beruf", 11, "Büroausstattung und Büromaterial", "321", "A2", 0],
  ["N12", "N", "Arbeit und Beruf", 12, "Computer und Internet", "322–324", "B1", 0],
  ["O1", "O", "Freizeit und kulturelles Leben", 1, "Freizeit und Hobbys allgemein", "326–329", "A2", 0],
  ["O2", "O", "Freizeit und kulturelles Leben", 2, "Malen, basteln, Handarbeit und Farben", "329–331", "B2", 0],
  ["O3", "O", "Freizeit und kulturelles Leben", 3, "Spielen und Spielzeug", "332", "B1", 0],
  ["O4", "O", "Freizeit und kulturelles Leben", 4, "Musik, Musikinstrumente und Konzerte", "333–334", "B2", 0],
  ["O5", "O", "Freizeit und kulturelles Leben", 5, "Veranstaltungen allgemein", "335–336", "B1", 0],
  ["O6", "O", "Freizeit und kulturelles Leben", 6, "Theater", "337", "B2", 0],
  ["O7", "O", "Freizeit und kulturelles Leben", 7, "Film, Kino und Fotografie", "338–339", "B1", 0],
  ["O8", "O", "Freizeit und kulturelles Leben", 8, "Kunst und Ausstellungen", "340", "B2", 0],
  ["O9", "O", "Freizeit und kulturelles Leben", 9, "Sport", "341–343", "B1", 0],
  ["O10", "O", "Freizeit und kulturelles Leben", 10, "Radio und Fernsehen", "344–345", "B2", 0],
  ["O11", "O", "Freizeit und kulturelles Leben", 11, "Literatur und Presse", "346–347", "B2", 0],
  ["O12", "O", "Freizeit und kulturelles Leben", 12, "Feste und Feiern", "348", "B2", 0],
  ["O13", "O", "Freizeit und kulturelles Leben", 13, "Religion", "349–350", "B2", 0],
  ["P1", "P", "Politik und Gesellschaft", 1, "Staatsformen", "352–354", "C1", 0],
  ["P2", "P", "Politik und Gesellschaft", 2, "Bundesstaat und Bundesländer", "355–357", "B2", 1],
  ["P3", "P", "Politik und Gesellschaft", 3, "Rechtsstaatlichkeit", "358–359", "B2", 1],
  ["P4", "P", "Politik und Gesellschaft", 4, "Sozialstaat", "360–362", "B2", 0],
  ["P5", "P", "Politik und Gesellschaft", 5, "Demokratie und Wahlen", "363–364", "B2", 1],
  ["P6", "P", "Politik und Gesellschaft", 6, "Parteien in Deutschland", "365–366", "B2", 1],
  ["P7", "P", "Politik und Gesellschaft", 7, "Migration und Integration", "367–368", "B2", 1],
  ["P8", "P", "Politik und Gesellschaft", 8, "Aktuelle Ereignisse und Schlagzeilen", "369", "B2", 0],
  ["P9", "P", "Politik und Gesellschaft", 9, "Internationale Organisationen", "370", "B1", 0],
  ["P10", "P", "Politik und Gesellschaft", 10, "Krieg und Konfliktlösung", "371", "B2", 0],
  ["P11", "P", "Politik und Gesellschaft", 11, "Militär und Armee", "372–373", "B2", 0],
  ["P12", "P", "Politik und Gesellschaft", 12, "Wirtschaft", "373–374", "B2", 0],
  ["P13", "P", "Politik und Gesellschaft", 13, "Recht, Gericht und Haft", "375", "C1", 1]];

// Книга: ожидаемый размер файла и положение картинки каждой страницы внутри PDF [начало, длина]
const BOOK_SIZE = 54513163;
const BOOK_PAGES = [[3706,167843],[171994,40618],[213064,123452],[336968,71473],[408894,201119],[610466,195398],[806316,34914],[841682,73072],[915206,85707],[1001366,164519],[1166338,120681],[1287472,137129],[1425054,106054],[1531561,109352],[1641366,115234],[1757053,120323],[1877829,104457],[1982739,116716],[2099908,138049],[2238410,126329],[2365191,93623],[2459267,118973],[2578693,107135],[2686281,112349],[2799086,145729],[2945275,163884],[3109619,143138],[3253217,111530],[3365207,102993],[3468660,107291],[3576410,71735],[3648604,52265],[3701329,129705],[3831494,114302],[3946256,121296],[4068012,151506],[4219978,139961],[4360399,138709],[4499568,123415],[4623443,135344],[4759247,164243],[4923950,145553],[5069962,71852],[5142274,156980],[5299714,140314],[5440488,124346],[5565294,123237],[5688991,152345],[5841796,116126],[5958382,141133],[6099975,112399],[6212834,122063],[6335356,79997],[6415813,145003],[6561276,136232],[6697967,66779],[6765206,109710],[6875376,141622],[7017458,151388],[7169306,101541],[7271306,79998],[7351764,157711],[7509935,142229],[7652624,156690],[7809774,135978],[7946212,123519],[8070191,132979],[8203630,155338],[8359428,143276],[8503164,119011],[8622635,102695],[8725789,73710],[8799958,98304],[8898722,116336],[9015517,87373],[9103350,150643],[9254452,69003],[9323915,100971],[9425346,100276],[9526082,124401],[9650942,97398],[9748800,149541],[9898801,129741],[10029002,131565],[10161026,83957],[10245442,99201],[10345103,127073],[10472636,153197],[10626293,108672],[10735424,68888],[10804771,73764],[10878995,137583],[11017038,123980],[11141478,156818],[11298756,147728],[11446943,94340],[11541743,139529],[11681732,129139],[11811331,160840],[11972630,88406],[12061496,176305],[12238261,153451],[12392172,157405],[12550037,117380],[12667877,133914],[12802251,114435],[12917146,122138],[13039743,61242],[13101445,124814],[13226719,137306],[13364485,155557],[13520502,130801],[13651763,150637],[13802860,128779],[13932099,131442],[14064001,100459],[14164920,131314],[14296694,113216],[14410370,117684],[14528513,70267],[14599240,188857],[14788557,162922],[14951939,115960],[15068358,88469],[15157287,168199],[15325946,144741],[15471147,106149],[15577756,131480],[15709696,124465],[15834621,155332],[15990413,148076],[16138949,114620],[16254028,87260],[16341748,135028],[16477235,79115],[16556809,73211],[16630479,91561],[16722500,150487],[16873447,202704],[17076610,68180],[17145250,151890],[17297600,116500],[17414559,86725],[17501744,108530],[17610734,117750],[17728944,120832],[17850236,164226],[18014922,192946],[18208328,146869],[18355656,83817],[18439933,115293],[18555686,101815],[18657960,90368],[18748788,127779],[18877027,140032],[19017519,164357],[19182336,128462],[19311257,85600],[19397316,96086],[19493862,148267],[19642589,145073],[19788122,144326],[19932908,136172],[20069540,122706],[20192706,147705],[20340871,122497],[20463827,76322],[20540609,155435],[20696504,146612],[20843575,80743],[20924777,89655],[21014892,149767],[21165119,148328],[21313906,94996],[21409362,123595],[21533417,121502],[21655379,122028],[21777867,136713],[21915040,117992],[22033492,100063],[22134015,164291],[22298766,172647],[22471873,148848],[22621181,131221],[22752862,155064],[22908386,146314],[23055160,107223],[23162842,96821],[23260123,135402],[23395985,189470],[23585915,107155],[23693530,128731],[23822721,114515],[23937696,100105],[24038261,144122],[24182843,152013],[24335316,111459],[24447234,64122],[24511815,94048],[24606323,170843],[24777626,122297],[24900382,81572],[24982414,114743],[25097617,120635],[25218712,125861],[25345032,72622],[25418114,135425],[25553999,142011],[25696470,149539],[25846469,162393],[26009322,114045],[26123827,164542],[26288829,139855],[26429144,185888],[26615492,128550],[26744502,167345],[26912307,131810],[27044576,77994],[27123030,140366],[27263855,61291],[27325606,121548],[27447614,136959],[27585033,135726],[27721218,94288],[27815966,181131],[27997557,166449],[28164466,102071],[28266996,83325],[28350781,166264],[28517505,110561],[28628526,147318],[28776304,107167],[28883931,127909],[29012299,70959],[29083718,156701],[29240879,136612],[29377951,137670],[29516080,86164],[29602704,148128],[29751292,128178],[29879929,89801],[29970189,77928],[30048576,62453],[30111489,110429],[30222377,92583],[30315419,67414],[30383292,94047],[30477799,141392],[30619651,136393],[30756507,130844],[30887818,136467],[31024751,89651],[31114868,96233],[31211568,155637],[31367672,153228],[31521367,168464],[31690298,138615],[31829379,94565],[31924411,167076],[32091954,130943],[32223364,150321],[32374152,140661],[32515280,123724],[32639470,98378],[32738314,81628],[32820409,147210],[32968086,141560],[33110113,168866],[33279446,143056],[33422969,139516],[33562952,137908],[33701327,137777],[33839571,166152],[34006190,125382],[34132039,205781],[34338287,161173],[34499926,54177],[34554569,47884],[34602920,195789],[34799176,205688],[35005331,189521],[35195318,63547],[35259331,69659],[35329457,149713],[35479637,102528],[35582632,166134],[35749233,140108],[35889808,168749],[36059024,103702],[36163193,186874],[36350534,139454],[36490455,134359],[36625281,171981],[36797729,150944],[36949140,163626],[37113233,111686],[37225386,121917],[37347769,69824],[37418060,135680],[37554207,116749],[37671423,114769],[37786659,160889],[37948015,162189],[38110671,170871],[38282009,128464],[38410940,137364],[38548771,117873],[38667111,102581],[38770159,113841],[38884467,134848],[39019782,171006],[39191255,139571],[39331293,149448],[39481208,148711],[39630385,96685],[39727537,181245],[39909249,113161],[40022877,129835],[40153179,144773],[40298418,81474],[40380359,126954],[40507780,114906],[40623153,115653],[40739273,147846],[40887586,113223],[41001275,78667],[41080409,104343],[41185219,102032],[41287718,155070],[41443255,121033],[41564755,151272],[41716494,162029],[41878990,171434],[42050891,161846],[42213203,95042],[42308712,111497],[42420676,168059],[42589202,163223],[42752892,118016],[42871375,168710],[43040552,141167],[43182185,92744],[43275396,159861],[43435724,165539],[43601730,107294],[43709491,154078],[43864036,130645],[43995148,133086],[44128701,166104],[44295272,156612],[44452351,124981],[44577798,69445],[44647710,185334],[44833511,191784],[45025762,114324],[45140553,110357],[45251377,196207],[45448051,172134],[45620652,178685],[45799804,181602],[45981873,147845],[46130185,180422],[46311074,113771],[46425312,154723],[46580502,123482],[46704451,196092],[46901010,178207],[47079684,184959],[47265110,154477],[47420054,208577],[47629098,162575],[47792140,143733],[47936339,69907],[48006713,149466],[48156645,96377],[48253489,163901],[48417857,223295],[48641619,219289],[48861375,240469],[49102311,215148],[49317926,213587],[49531980,215465],[49747912,226288],[49974667,247251],[50222385,241879],[50464731,224597],[50689795,265722],[50955984,237532],[51193983,245960],[51440410,230268],[51671145,243620],[51915232,249651],[52165350,256464],[52422281,249708],[52672456,234985],[52907908,258218],[53166593,249458],[53416518,236772],[53653757,222082],[53876306,302805],[54179578,301173]];
const BOOK_ROW = 'Книга (PDF в Google Диске)';

/* ---------- установка ---------- */
function setup() {
  const ss = SpreadsheetApp.getActive();
  let sh = ss.getSheetByName(SHEET_TOPICS) || ss.insertSheet(SHEET_TOPICS);
  if (sh.getLastRow() < 2) {
    sh.clear();
    const rows = TOPICS.map(t => [t[0], t[1], t[2], t[3], t[4], t[5], t[6], t[7] ? '★' : '', '', '', '']);
    sh.getRange(1, 1, 1, TOPIC_HEAD.length).setValues([TOPIC_HEAD]).setFontWeight('bold');
    sh.getRange(2, 1, rows.length, TOPIC_HEAD.length).setNumberFormat('@').setValues(rows.map(r => r.map(String)));
    sh.setFrozenRows(1);
    sh.autoResizeColumns(1, TOPIC_HEAD.length);
  }
  let ls = ss.getSheetByName(SHEET_LESSONS) || ss.insertSheet(SHEET_LESSONS);
  if (ls.getLastRow() < 1) {
    ls.getRange(1, 1, 1, LESSON_HEAD.length).setValues([LESSON_HEAD]).setFontWeight('bold');
    ls.getRange('A:E').setNumberFormat('@');
    ls.setFrozenRows(1);
  }
  let st = ss.getSheetByName(SHEET_STATE) || ss.insertSheet(SHEET_STATE);
  if (st.getLastRow() < 1) {
    st.getRange('A:B').setNumberFormat('@');
    st.getRange(1, 1, 4, 2).setValues([['Параметр', 'Значение'], ['Остановились на теме', 'A1'], ['Текущий урок №', '0'], [BOOK_ROW, '']]);
    st.getRange(1, 1, 1, 2).setFontWeight('bold');
  }
  const blank = ss.getSheetByName('Лист1') || ss.getSheetByName('Sheet1');
  if (blank && ss.getSheets().length > 3 && blank.getLastRow() === 0) ss.deleteSheet(blank);

  const props = PropertiesService.getScriptProperties();
  let key = props.getProperty('KEY');
  if (!key) { key = Utilities.getUuid().replace(/-/g, '').slice(0, 16); props.setProperty('KEY', key); }
  Logger.log('КЛЮЧ ДЛЯ САЙТА: ' + key);
  try { Logger.log(findBook()); } catch (err) { Logger.log('Книга: ' + err.message); }
  return key;
}

/* ---------- книга в Google Диске ---------- */
function fileIdFrom(s) {
  s = String(s || '').trim();
  const m = /\/d\/([\w-]{20,})/.exec(s) || /[?&]id=([\w-]{20,})/.exec(s) || /^([\w-]{20,})$/.exec(s);
  return m ? m[1] : '';
}
/** Найти PDF: ссылка на листе «Состояние» или поиск по Диску. Проверяет размер файла. */
function findBook() {
  const props = PropertiesService.getScriptProperties();
  let id = fileIdFrom(stateMap()[BOOK_ROW]);
  if (!id) {
    const it = DriveApp.searchFiles('mimeType = "application/pdf" and title contains "Wortschatz" and trashed = false');
    while (it.hasNext()) { const f = it.next(); if (f.getSize() === BOOK_SIZE) { id = f.getId(); break; } }
  }
  if (!id) { props.deleteProperty('BOOK_ID'); throw new Error('PDF не найден. Загрузите его в Google Диск или вставьте ссылку на листе «Состояние».'); }
  const f = DriveApp.getFileById(id);
  if (f.getSize() !== BOOK_SIZE) throw new Error('Файл «' + f.getName() + '» не совпадает с книгой (размер ' + f.getSize() + ', нужно ' + BOOK_SIZE + ').');
  props.setProperty('BOOK_ID', id);
  setState(BOOK_ROW, 'https://drive.google.com/file/d/' + id + '/view');
  return 'Книга подключена: ' + f.getName();
}
function bookId() {
  const id = PropertiesService.getScriptProperties().getProperty('BOOK_ID');
  if (!id) throw new Error('no_book');
  return id;
}
/** Картинки страниц: читаем из PDF только нужные байты (Drive API, Range). */
function readPages(list) {
  const id = bookId();
  const token = ScriptApp.getOAuthToken();
  const ps = list.map(Number).filter(p => p >= 0 && p < BOOK_PAGES.length).slice(0, 6);
  const reqs = ps.map(p => ({
    url: 'https://www.googleapis.com/drive/v3/files/' + id + '?alt=media&supportsAllDrives=true',
    headers: { Authorization: 'Bearer ' + token, Range: 'bytes=' + BOOK_PAGES[p][0] + '-' + (BOOK_PAGES[p][0] + BOOK_PAGES[p][1] - 1) },
    muteHttpExceptions: true
  }));
  const res = UrlFetchApp.fetchAll(reqs);
  const out = {};
  res.forEach((r, i) => {
    const code = r.getResponseCode();
    if (code !== 206 && code !== 200) throw new Error('drive_' + code);
    let bytes = r.getContent();
    if (code === 200) bytes = bytes.slice(BOOK_PAGES[ps[i]][0], BOOK_PAGES[ps[i]][0] + BOOK_PAGES[ps[i]][1]);
    out[ps[i]] = Utilities.base64Encode(bytes);
  });
  return out;
}

/** Показать ключ ещё раз (если потеряли). */
function showKey() { Logger.log('КЛЮЧ ДЛЯ САЙТА: ' + PropertiesService.getScriptProperties().getProperty('KEY')); }

/** Сменить ключ (старые ссылки перестанут работать). */
function resetKey() { PropertiesService.getScriptProperties().deleteProperty('KEY'); return setup(); }

/* ---------- веб-приложение ---------- */
function doGet(e) { return respond(handle(e && e.parameter ? e.parameter : {})); }
function doPost(e) {
  let p = {};
  try { p = JSON.parse(e.postData.contents || '{}'); } catch (err) { return respond({ ok: false, error: 'bad_json' }); }
  return respond(handle(p));
}
function respond(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

function handle(p) {
  const key = PropertiesService.getScriptProperties().getProperty('KEY');
  if (!key || String(p.key || '') !== key) return { ok: false, error: 'bad_key' };
  const action = String(p.action || 'state');
  if (action === 'state') return { ok: true, state: readState() };
  if (action === 'pages') {
    try { return { ok: true, pages: readPages(String(p.ps || p.p || '').split(',')) }; }
    catch (err) { return { ok: false, error: String(err && err.message || err) }; }
  }
  const lock = LockService.getScriptLock();
  lock.waitLock(15000);
  try {
    const who = String(p.who || '').slice(0, 40);
    switch (action) {
      case 'setCur': setState('Остановились на теме', checkId(p.id)); break;
      case 'done': markDone(checkId(p.id), true, who); break;
      case 'undone': markDone(checkId(p.id), false, who); break;
      case 'doneNext': {
        const id = checkId(p.id); markDone(id, true, who);
        const i = TOPICS.findIndex(t => t[0] === id);
        if (i >= 0 && i + 1 < TOPICS.length) setState('Остановились на теме', TOPICS[i + 1][0]);
        break;
      }
      case 'newLesson': newLesson(); break;
      case 'note': setNote(Number(p.n), String(p.text || '').slice(0, 2000)); break;
      case 'setBook': setState(BOOK_ROW, String(p.link || '')); findBook(); break;
      default: return { ok: false, error: 'unknown_action' };
    }
    SpreadsheetApp.flush();
    return { ok: true, state: readState() };
  } catch (err) {
    return { ok: false, error: String(err && err.message || err) };
  } finally {
    lock.releaseLock();
  }
}

function checkId(id) {
  id = String(id || '');
  if (!TOPICS.some(t => t[0] === id)) throw new Error('unknown_topic ' + id);
  return id;
}
function today() { return Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd'); }

/* ---------- чтение ---------- */
function readState() {
  const ss = SpreadsheetApp.getActive();
  const st = stateMap();
  const done = {};
  const sh = ss.getSheetByName(SHEET_TOPICS);
  const vals = sh.getRange(2, 1, Math.max(sh.getLastRow() - 1, 1), TOPIC_HEAD.length).getDisplayValues();
  vals.forEach(r => { if (r[0] && r[8]) done[r[0]] = { d: r[8], l: Number(r[9]) || 0, by: r[10] || '' }; });
  const ls = ss.getSheetByName(SHEET_LESSONS);
  const lessons = [];
  if (ls.getLastRow() > 1) {
    ls.getRange(2, 1, ls.getLastRow() - 1, LESSON_HEAD.length).getDisplayValues().forEach(r => {
      if (r[0]) lessons.push({ n: Number(r[0]), date: r[1], note: r[4] || '' });
    });
  }
  return {
    cur: st['Остановились на теме'] || 'A1',
    lesson: Number(st['Текущий урок №']) || 0,
    done: done,
    lessons: lessons,
    book: !!PropertiesService.getScriptProperties().getProperty('BOOK_ID'),
    at: new Date().toISOString()
  };
}
function stateMap() {
  const sh = SpreadsheetApp.getActive().getSheetByName(SHEET_STATE);
  const m = {};
  sh.getRange(1, 1, sh.getLastRow(), 2).getDisplayValues().forEach(r => { m[r[0]] = r[1]; });
  return m;
}

/* ---------- запись ---------- */
function setState(name, value) {
  const sh = SpreadsheetApp.getActive().getSheetByName(SHEET_STATE);
  const vals = sh.getRange(1, 1, sh.getLastRow(), 1).getValues();
  for (let i = 0; i < vals.length; i++) {
    if (vals[i][0] === name) { sh.getRange(i + 1, 2).setNumberFormat('@').setValue(String(value)); return; }
  }
  sh.appendRow([name, String(value)]);
}

function markDone(id, on, who) {
  const sh = SpreadsheetApp.getActive().getSheetByName(SHEET_TOPICS);
  const ids = sh.getRange(2, 1, sh.getLastRow() - 1, 1).getValues().map(r => String(r[0]));
  const i = ids.indexOf(id);
  if (i < 0) throw new Error('unknown_topic ' + id);
  const lesson = Number(stateMap()['Текущий урок №']) || 0;
  const row = on ? [today(), lesson ? String(lesson) : '', who] : ['', '', ''];
  sh.getRange(i + 2, 9, 1, 3).setNumberFormat('@').setValues([row]);
  refreshLessonTopics();
}

function newLesson() {
  const ls = SpreadsheetApp.getActive().getSheetByName(SHEET_LESSONS);
  let max = Number(stateMap()['Текущий урок №']) || 0;
  if (ls.getLastRow() > 1) ls.getRange(2, 1, ls.getLastRow() - 1, 1).getValues().forEach(r => { max = Math.max(max, Number(r[0]) || 0); });
  const n = max + 1;
  ls.appendRow([String(n), today(), '', '', '']);
  ls.getRange(ls.getLastRow(), 1, 1, LESSON_HEAD.length).setNumberFormat('@');
  setState('Текущий урок №', n);
}

function setNote(n, text) {
  const ls = SpreadsheetApp.getActive().getSheetByName(SHEET_LESSONS);
  if (ls.getLastRow() < 2) return;
  const nums = ls.getRange(2, 1, ls.getLastRow() - 1, 1).getValues().map(r => Number(r[0]));
  const i = nums.indexOf(n);
  if (i >= 0) ls.getRange(i + 2, 5).setValue(text);
}

/** Пересобрать колонки «Темы» и «Страницы» на листе «Уроки» по отметкам на листе «Темы». */
function refreshLessonTopics() {
  const ss = SpreadsheetApp.getActive();
  const sh = ss.getSheetByName(SHEET_TOPICS);
  const vals = sh.getRange(2, 1, sh.getLastRow() - 1, TOPIC_HEAD.length).getDisplayValues();
  const by = {};
  vals.forEach(r => {
    const l = Number(r[9]); if (!l || !r[8]) return;
    (by[l] = by[l] || []).push(r);
  });
  const ls = ss.getSheetByName(SHEET_LESSONS);
  if (ls.getLastRow() < 2) return;
  const nums = ls.getRange(2, 1, ls.getLastRow() - 1, 1).getValues().map(r => Number(r[0]));
  const out = nums.map(n => {
    const rows = by[n] || [];
    const topics = rows.map(r => r[0] + ' ' + r[4]).join('; ');
    const pages = [];
    rows.forEach(r => String(r[5]).split('–').forEach(x => { const v = Number(x); if (v) pages.push(v); }));
    const pg = pages.length ? (Math.min.apply(null, pages) === Math.max.apply(null, pages) ? String(pages[0]) : Math.min.apply(null, pages) + '–' + Math.max.apply(null, pages)) : '';
    return [topics, pg];
  });
  ls.getRange(2, 3, out.length, 2).setNumberFormat('@').setValues(out);
}
