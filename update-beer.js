const axios = require('axios');

async function sendBeerUpdate() {
    const APIFY_TOKEN = process.env.APIFY_TOKEN;
    const TELEGRAM_TOKEN = process.env.TELEGRAM_TOKEN;
    const DATASET_ID = "Dk8oGPhm0nC5dJdti";
    const CHAT_ID = "@beerpulsenews";

    try {
        // משיכת 5 פריטים אחרונים כדי לוודא שאנחנו לא מפספסים פוסט בגלל שורת מערכת [cite: 2026-01-23]
        const apifyUrl = `https://api.apify.com/v2/datasets/${DATASET_ID}/items?token=${APIFY_TOKEN}&limit=5&desc=1&clean=1`;
        const response = await axios.get(apifyUrl);
        
        if (!response.data || response.data.length === 0) {
            console.log("Dataset is empty.");
            return;
        }

        // חיפוש פשוט: הפריט הראשון שיש לו טקסט או URL [cite: 2026-01-23]
        const post = response.data.find(item => (item.text || item.caption) && item.url);

        if (!post) {
            console.log("No valid post found in the last 5 items.");
            return;
        }

        // חילוץ נתונים עם "גיבוי" לכל שדה [cite: 2026-01-23]
        const breweryName = post.pageName || post.user || post.ownerName || "עדכון ממבשלה";
        const postText = post.text || post.caption || post.description || "";
        
        // התיקון הקריטי ללינק - מנסים למצוא את הלינק הספציפי ביותר [cite: 2026-01-23]
        const postUrl = post.url || post.canonicalUrl || post.facebookUrl;

        const shortText = postText.length > 850 ? postText.substring(0, 850) + "..." : postText;

        const message = `<b>🍺 עדכון מבשלה חדש 🍺</b>\n\n<b>מבשלה:</b> ${breweryName}\n\n${shortText}\n\n🔗 <a href="${postUrl}">לפוסט המלא בפייסבוק</a>`;

        const telegramUrl = `https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`;
        await axios.post(telegramUrl, {
            chat_id: CHAT_ID,
            text: message,
            parse_mode: 'HTML',
            disable_web_page_preview: false 
        });

        console.log(`Successfully sent: ${breweryName}`);

    } catch (error) {
        console.error("Error details:", error.response ? error.response.data : error.message);
    }
}

sendBeerUpdate();
