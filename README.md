# Our Little Story — 4 Months (v11)

เว็บไซต์ครบรอบ 4 เดือนแบบ Interactive Story สำหรับเปิดใน VS Code / Live Server

## สิ่งที่ปรับใน v11
- ปรับข้อความบทนำให้รู้สึกเป็นเรื่องของ “เรา” มากขึ้น
- ปรับข้อความหน้าไพ่ให้มี microcopy และความรู้สึกส่วนตัวมากขึ้น
- เพิ่ม `wrongMessage` แยกทั้ง 9 ข้อ: ตอบผิดแต่ละข้อจะแสดงข้อความคนละประโยค
- คงระบบตรวจคำตอบแบบ exact match ไม่รับคำตอบที่เป็นเพียงบางส่วน
- ปรับข้อความ Reward ของทั้ง 9 ใบให้สื่อสารเป็นความทรงจำมากขึ้น
- ปรับฉาก Tower Finale ให้เป็น emotional climax ชัดขึ้น
- ย้ายข้อความของ Finale / Secret / Secret Memory ที่แก้บ่อยไปไว้ใน `js/config.js`
- คง Romantic Scrapbook และ popup รูปภาพเดิม
- คงระบบตัวช่วย 3 ครั้ง และใช้ได้ครั้งเดียวต่อการ์ด
- คงระบบ live relationship timer, audio, cinematic unlock และ secret ending

## จุดที่แก้ข้อความเองภายหลัง
เปิด `js/config.js` แล้วแก้ได้โดยตรง โดยเฉพาะ:
- `intro.subtitle`
- `intro.lobbyMessage`
- `cards[].prompt`
- `cards[].rewardText`
- `cards[].timelineText`
- `cards[].wrongMessage` ← ข้อความเมื่อผู้เล่นตอบผิดของแต่ละข้อ
- `letter.body`
- `finale.*`
- `secret.*`
- `secretMemory.*`

ถ้าจะใส่ชื่อจริง ให้แก้ `couple.yourName` และ `couple.partnerName` ใน `js/config.js`

## วิธีเปิด
1. เปิดโฟลเดอร์นี้ใน VS Code
2. แนะนำให้ใช้ Live Server
3. เปิด `index.html`
4. ถ้าจะทดสอบใหม่ทั้งหมด กด `รีเซ็ตความคืบหน้า`
5. ปุ่ม TEST สำหรับปลดล็อกทั้ง 9 ใบยังคงมีไว้เพื่อทดสอบระบบ

## Tower House
ไฟล์โมเดลที่คาดหวังคือ:
`assets/models/tower-house.glb`

ถ้าไม่มีไฟล์นี้ เว็บไซต์จะใช้ CSS fallback tower แทน เพื่อไม่ให้หน้าเว็บพัง
