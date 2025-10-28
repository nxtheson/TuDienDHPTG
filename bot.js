{\rtf1\ansi\ansicpg1252\cocoartf2820
\cocoatextscaling0\cocoaplatform0{\fonttbl\f0\fswiss\fcharset0 Helvetica;}
{\colortbl;\red255\green255\blue255;}
{\*\expandedcolortbl;;}
\paperw11900\paperh16840\margl1440\margr1440\vieww11520\viewh8400\viewkind0
\pard\tx720\tx1440\tx2160\tx2880\tx3600\tx4320\tx5040\tx5760\tx6480\tx7200\tx7920\tx8640\pardirnatural\partightenfactor0

\f0\fs24 \cf0 import express from "express";\
import fetch from "node-fetch";\
import Papa from "papaparse";\
import \{ Client, GatewayIntentBits \} from "discord.js";\
\
const app = express();\
// keep-alive route for Render health checks\
app.get("/", (req, res) => res.send("ok"));\
\
const PORT = process.env.PORT || 3000;\
app.listen(PORT, () => console.log(`Web server listening on $\{PORT\}`));\
\
// ---- Discord bot ----\
const TOKEN = process.env.BOT_TOKEN;\
const SHEET_URL = process.env.SHEET_URL; // CSV export link\
\
if (!TOKEN || !SHEET_URL) \{\
  console.error("Missing BOT_TOKEN or SHEET_URL in env");\
  process.exit(1);\
\}\
\
const client = new Client(\{\
  intents: [\
    GatewayIntentBits.Guilds,\
    GatewayIntentBits.GuildMessages,\
    GatewayIntentBits.MessageContent\
  ],\
\});\
\
client.once("ready", () => \{\
  console.log(`Bot logged in as $\{client.user.tag\}`);\
\});\
\
// helper: load sheet CSV -> array of rows (objects)\
async function loadSheet() \{\
  const res = await fetch(SHEET_URL);\
  const text = await res.text();\
  const parsed = Papa.parse(text, \{ header: true, skipEmptyLines: true \});\
  return parsed.data; // array of objects keyed by header\
\}\
\
// When someone mentions bot or uses !search\
client.on("messageCreate", async (msg) => \{\
  if (msg.author.bot) return;\
\
  // trigger: mention bot OR message starts with !search\
  const content = msg.content.trim();\
  const mentioned = msg.mentions.has(client.user);\
  let keyword = null;\
\
  if (content.toLowerCase().startsWith("!search")) \{\
    keyword = content.split(" ").slice(1).join(" ").toLowerCase().trim();\
  \} else if (mentioned) \{\
    // remove mention and parse keyword\
    const withoutMention = content.replace(/<@!?\\d+>/, "").trim();\
    keyword = withoutMention.split(" ").join(" ").toLowerCase().trim();\
  \} else \{\
    return;\
  \}\
\
  if (!keyword) \{\
    return msg.reply("G\'f5 t\uc0\u7915  kho\'e1 sau `!search` ho\u7863 c tag t\'f4i k\'e8m t\u7915  kho\'e1 nh\'e9.");\
  \}\
\
  await msg.channel.sendTyping();\
\
  try \{\
    const rows = await loadSheet();\
    // search in 'Nguy\'ean li\uc0\u7879 u' and 'T\'ean \u273 \u417 n h\'e0ng' columns (case-insensitive)\
    const found = rows.filter((r) => \{\
      const ing = (r["Nguy\'ean li\uc0\u7879 u"] || "").toLowerCase();\
      const name = (r["T\'ean \uc0\u273 \u417 n h\'e0ng"] || "").toLowerCase();\
      return ing.includes(keyword) || name.includes(keyword);\
    \});\
\
    if (!found || found.length === 0) \{\
      return msg.reply(`\uc0\u10060  Kh\'f4ng t\'ecm th\u7845 y k\u7871 t qu\u7843  cho: **$\{keyword\}**`);\
    \}\
\
    // build reply (limit length)\
    const blocks = found.slice(0, 5).map((r) => \{\
      const ingrPretty = (r["Nguy\'ean li\uc0\u7879 u"] || "").split(";").map(s => s.trim()).join("\\n");\
      return `**T\'ean \uc0\u273 \u417 n h\'e0ng:** $\{r["T\'ean \u273 \u417 n h\'e0ng"] || "\'97"\}\\n**Ph\u7847 n th\u432 \u7903 ng:** $\{r["Ph\u7847 n th\u432 \u7903 ng"] || "\'97"\}\\n**Nguy\'ean li\u7879 u:**\\n$\{ingrPretty\}`;\
    \});\
\
    let reply = blocks.join("\\n\\n---\\n\\n");\
    if (reply.length > 1900) reply = reply.slice(0, 1900) + "\\n\'85";\
\
    await msg.reply(reply);\
  \} catch (err) \{\
    console.error(err);\
    msg.reply("C\'f3 l\uc0\u7895 i khi \u273 \u7885 c sheet. Ki\u7875 m tra SHEET_URL v\'e0 quy\u7873 n public.");\
  \}\
\});\
\
client.login(TOKEN);}