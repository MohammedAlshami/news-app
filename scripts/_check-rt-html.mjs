const url = "https://arabic.rt.com/business/1789162-%D8%B5%D9%86%D8%AF%D9%88%D9%82-%D8%A7%D9%84%D9%86%D9%82%D8%AF-%D8%A7%D9%84%D8%AD%D9%88%D8%A7%D8%B1-%D8%A8%D9%8A%D9%86-%D9%88%D8%A7%D8%B4%D9%86%D8%B7%D9%86-%D9%88%D8%A8%D9%83%D9%8A%D9%86-%D9%8A%D8%AF%D8%B9%D9%85-%D8%A7%D8%B3%D8%AA%D9%82%D8%B1%D8%A7%D8%B1-%D8%A7%D9%84%D8%A7%D9%82%D8%AA%D8%B5%D8%A7%D8%AF-%D8%A7%D9%84%D8%B9%D8%A7%D9%84%D9%85%D9%8A/"

const html = await fetch(url, {
  headers: {
    "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "accept": "text/html,application/xhtml+xml",
    "accept-language": "ar,en;q=0.9",
  }
}).then(r => r.text())

// Find all class names containing "article"
const classMatches = [...html.matchAll(/class="([^"]*article[^"]*)"/gi)].map(m => m[1])
const uniqueClasses = [...new Set(classMatches)].slice(0, 30)
console.log("=== Article-related classes ===")
uniqueClasses.forEach(c => console.log(" ", c))

// Find all class names containing "text" or "body" or "content"
const contentMatches = [...html.matchAll(/class="([^"]*(?:text|body|content|lead|summary)[^"]*)"/gi)].map(m => m[1])
const uniqueContent = [...new Set(contentMatches)].slice(0, 20)
console.log("\n=== Content-related classes ===")
uniqueContent.forEach(c => console.log(" ", c))

// Sample first 3 paragraphs with actual text
const pMatches = [...html.matchAll(/<p[^>]*>([\s\S]{30,300}?)<\/p>/gi)].slice(0, 5)
console.log("\n=== Sample paragraphs ===")
pMatches.forEach(m => console.log(" ", m[1].replace(/<[^>]+>/g, "").trim().slice(0, 120)))
