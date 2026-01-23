const axios = require('axios');

async function sendInstagram() {
    const { APIFY_TOKEN, TELEGRAM_TOKEN } = process.env;
    const ACTOR_ID = "apify/instagram-post-scraper"; // המזהה המדויק שלך [cite: 2026-01-23]
    const CHAT_ID = "@beerpulsenews";

    try {
        console.log("סריקת אינסטגרם: מחפש פוסטים חדשים...");
        const runsUrl = `https://api.apify.com/v2/actor-runs?token=${APIFY_TOKEN}&actorId=${ACTOR_ID}&limit=1&desc=1`;
        const runsResponse = await axios.get(runsUrl);
        const lastRun = runsResponse.data.data.items[0];

        if (!lastRun || lastRun.status !== 'SUCCEEDED') return;

        const dataUrl = `https://api.apify.com/v2/datasets/${lastRun.defaultDatasetId}/items?token=${APIFY_TOKEN}&limit=15&desc=1`;
        const dataResponse = await axios.get(dataUrl);

        const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

        const validPosts = dataResponse.data.filter(item => {
            const postDate = new Date(item.timestamp || item.latestPostsBeforeTimestamp * 1000);
            return (item.caption || item.text) && item.url && postDate > twentyFourHoursAgo;
        });

        if (validPosts.length === 0) {
            console.log("לא נמצאו פוסטים חדשים באינסטגרם ב-24 השעות האחרונות.");
            return;
        }

        const post = validPosts[0];
        const name = post.ownerUsername || post.ownerFullName || "מבשלה (אינסטגרם)";
        const text = (post.caption || post.text || "").substring(0, 850);
        const url = post.url;

        await axios.post(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`, {
            chat_id: CHAT_ID,
            text: `<b>📸 ${name} באינסטגרם</b>\n\n${text}\n\n🔗 <a href="${url}">לפוסט המלא באינסטגרם</a>`,
            parse_mode: 'HTML'
        });
        console.log(`הודעת אינסטגרם נשלחה: ${name}`);
    } catch (e) { console.error("שגיאה באינסטגרם:", e.message); }
}
sendInstagram();
