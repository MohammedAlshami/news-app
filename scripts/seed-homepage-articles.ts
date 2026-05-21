/**
 * One-time seed: creates the homepage articles from the hardcoded data.
 * Downloads images from Unsplash and uploads them to R2.
 *
 *   npx tsx scripts/seed-homepage-articles.ts
 *
 * Requires `.env.local` with CLOUDFLARE_ACCOUNT_ID, CLOUDFLARE_DATABASE_ID,
 * CLOUDFLARE_D1_TOKEN, and R2_* vars.
 */
import { config } from "dotenv"
import { randomUUID } from "node:crypto"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"

import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3"

const root = join(dirname(fileURLToPath(import.meta.url)), "..")
config({ path: join(root, ".env.local") })
config({ path: join(root, ".env") })

function requireEnv(name: string): string {
  const val = process.env[name]
  if (!val) throw new Error(`Missing ${name} in .env.local`)
  return val
}

// ── Cloudflare D1 HTTP API ──────────────────────────────────────────

async function d1Query(sql: string, params: unknown[] = []) {
  const accountId = requireEnv("CLOUDFLARE_ACCOUNT_ID")
  const databaseId = requireEnv("CLOUDFLARE_DATABASE_ID")
  const token = requireEnv("CLOUDFLARE_D1_TOKEN")
  const res = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${accountId}/d1/database/${databaseId}/raw`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ sql, params, method: "all" }),
    },
  )
  if (!res.ok) throw new Error(`D1 query failed: ${res.status} ${await res.text()}`)
  const data = (await res.json()) as {
    result?: { results?: { columns: string[]; rows: unknown[][] } }[]
    success?: boolean
    errors?: Array<{ message?: string }>
  }
  if (!data.success) throw new Error(data.errors?.[0]?.message ?? "D1 query failed")
  return data.result?.[0]?.results?.rows ?? []
}

async function getExistingTitles(): Promise<Set<string>> {
  const rows = await d1Query("SELECT title FROM articles")
  return new Set(rows.map((r: unknown[]) => String(r[0])))
}

async function insertArticle(id: string, title: string, excerpt: string, body: string, categoryId: string | null, coverImageUrl: string) {
  const sql = `INSERT INTO articles (id, title, excerpt, body, is_published, category_id, cover_image_url, created_at, updated_at) VALUES (?, ?, ?, ?, 1, ?, ?, unixepoch() * 1000, unixepoch() * 1000)`
  await d1Query(sql, [id, title, excerpt, body, categoryId, coverImageUrl])
}

// ── R2 upload via S3 client ─────────────────────────────────────────

function getR2Client() {
  const accountId = requireEnv("R2_ACCOUNT_ID")
  return new S3Client({
    region: "auto",
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: requireEnv("R2_ACCESS_KEY_ID"),
      secretAccessKey: requireEnv("R2_SECRET_ACCESS_KEY"),
    },
  })
}

async function uploadImage(url: string, articleId: string): Promise<string> {
  const bucket = requireEnv("R2_BUCKET_NAME")
  const publicBase = requireEnv("R2_PUBLIC_URL").replace(/\/$/, "")

  console.log(`  Downloading ${url}`)
  const response = await fetch(url)
  if (!response.ok) throw new Error(`Failed to download ${url}: ${response.status}`)
  const buffer = Buffer.from(await response.arrayBuffer())
  const contentType = response.headers.get("content-type") || "image/jpeg"
  const ext = contentType.split("/")[1] || "jpg"
  const key = `articles/${articleId}/cover.${ext}`

  const client = getR2Client()
  await client.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: buffer,
      ContentType: contentType,
    }),
  )

  const publicUrl = `${publicBase}/${key}`
  console.log(`  Uploaded to ${publicUrl}`)
  return publicUrl
}

// ── Tiptap body ─────────────────────────────────────────────────────

function makeBody(text: string): string {
  return JSON.stringify({
    type: "doc",
    content: [{ type: "paragraph", content: [{ type: "text", text }] }],
  })
}

// ── Article data ────────────────────────────────────────────────────

async function main() {
  console.log("Checking for existing articles...")
  const existingTitles = await getExistingTitles()
  console.log(`Found ${existingTitles.size} existing articles.\n`)

  const catFinance = "44444444-4444-4444-4444-444444444444"
  const catSports  = "33333333-3333-3333-3333-333333333333"
  const catTech    = "11111111-1111-1111-1111-111111111111"

  const all: ArticleSeed[] = [
    // Hero
    { title: "طموح نووي في المحيط الهندي والهادئ", excerpt: "هناك أسباب عدة قد تدفع بعض الدول إلى السعي نحو امتلاك قدرات نووية في إقليم المحيط الهندي والهادئ؛ منها رغبة كبح أي عدوان محتمل. تُعدّ الأسلحة النووية رادعاً أقصى لأنها تُحدث دماراً وخسائر بشرية على نطاق يصعب استيعابه.", categoryId: null, imageUrl: "https://images.unsplash.com/photo-1630142895963-6996ae6b3a5b?q=80&w=1469&auto=format&fit=crop" },
    { title: "بركان ميرابي يثور ويقذف حمماً ساخنة", excerpt: "أظهرت لقطات التقطها مرصد بركان ميرابي الحكومي يوم الخميس حمماً متوهجة تخرج من الفوهة وعموداً كثيفاً من الغيوم الساخنة يصل ارتفاعه إلى نحو ١٬٣٠٠ متراً في الجو.", categoryId: null, imageUrl: "https://images.unsplash.com/photo-1525625293386-3f8f99389edd?q=80&w=1052&auto=format&fit=crop" },
    { title: "جوكوي يصل سنغافورة لإجراء محادثات مع رئيس الوزراء لي", excerpt: "يصل الرئيس الإندونيسي إلى سنغافورة في زيارة تركز على التجارة والاستقرار الإقليمي والعلاقات الثنائية، وتشمل لقاءات مع القادة لبحث ملفات المناخ والاستثمار والتعاون البحري.", categoryId: null, imageUrl: "https://images.unsplash.com/photo-1617191979724-f755c6d83e01?q=80&w=1471&auto=format&fit=crop" },
    // Campus
    { title: "معرض الفنون يفتتح موسماً جديداً من الأعمال المعاصرة على الحرم", excerpt: "", categoryId: null, imageUrl: "https://images.unsplash.com/photo-1579541814924-49fef17c5be5?q=80&w=670&auto=format&fit=crop" },
    { title: "ندوة حول التراث المعماري في أوروبا بين القرنين الخامس عشر والتاسع عشر", excerpt: "جلسة نقاش مع باحثين من كلية الآداب حول تأثير الطراز القوطي على العمارة الحديثة.", categoryId: null, imageUrl: "https://images.unsplash.com/photo-1548811579-017cf2a4268b?q=80&w=689&auto=format&fit=crop" },
    { title: "المكتبة المركزية تمدّ ساعات العمل خلال امتحانات نهاية الفصل", excerpt: "قاعات القراءة والأرشيف الرقمي متاحة حتى منتصف الليل في الأسابيع الثلاثة القادمة.", categoryId: null, imageUrl: "https://images.unsplash.com/photo-1545989253-02cc26577f88?q=80&w=1170&auto=format&fit=crop" },
    { title: "فريق الروبوتيكس يتأهل إلى المرحلة الوطنية بعد فوزه في التصفيات الإقليمية", excerpt: "مشروع الطلاب لهندسة البرمجيات يعرض حلاً لفرز النفايات الذكي داخل الحرم.", categoryId: null, imageUrl: "https://images.unsplash.com/photo-1579541591970-e5780dc6b31f?q=80&w=1343&auto=format&fit=crop" },
    // Finance
    { title: "حلول القروض المتاحة في أستراليا تدعم نمو المجتمعات المحلية", excerpt: "برامج تمويل مجتمعي توسّع نطاق الوصول إلى الائتمان وتدعم المشاريع الصغيرة والأسر التي تبحث عن فرص مستدامة.", categoryId: catFinance, imageUrl: "https://images.unsplash.com/photo-1592355591829-aaae33fcff1d?q=80&w=687&auto=format&fit=crop" },
    { title: "أدوات التكنولوجيا المالية تمكّن المستثمرين من كل الأحجام في سنغافورة", excerpt: "بمزيج من التكنولوجيا المتقدمة ودعم الحكومة والمنصات المبتكرة، تعزّز شركات التكنولوجيا المالية في سنغافورة تجربة الاستثمار للجميع.", categoryId: catFinance, imageUrl: "https://images.unsplash.com/photo-1568191009535-7d8b407d389a?q=80&w=764&auto=format&fit=crop" },
    { title: "المنصّات الرقمية في البرازيل تعزّز الثروة وتوسّع الفرص", excerpt: "بنية تحتية رقمية وتطبيقات سهلة تفتح مجالات الادّخار والاستثمار أمام شرائح أوسع من المواطنين في المدن والأرياف.", categoryId: catFinance, imageUrl: "https://images.unsplash.com/photo-1529912626516-e58b23f44f1d?q=80&w=687&auto=format&fit=crop" },
    { title: "ثقافة الاستثمار في البورصة الألمانية تغذّي ازدهارًا وطنيًا مستدامًا", excerpt: "ثقافة طويلة الأمد للاستثمار في الأسهم والادّخار المنتظم تعكس ثقة المواطنين بالاقتصاد المحلي وبشركاتها الكبرى.", categoryId: catFinance, imageUrl: "https://images.unsplash.com/photo-1732594207742-1ee7a1bb561b?q=80&w=657&auto=format&fit=crop" },
    // Sports
    { title: "المنتخب يؤكّد جاهزيته قبل مواجهة الحسم في تصفيات المنطقة", excerpt: "تدريبات ختامية تركّز على الجانب الدفاعي والسلّة السريعة، مع غياب لاعب واحد لأسباب احترازية.", categoryId: catSports, imageUrl: "https://plus.unsplash.com/premium_photo-1684820878202-52781d8e0ea9?q=80&w=1171&auto=format&fit=crop" },
    { title: "بطل سباق الماراثون المحلي يحطّم الرقم القياسي في خط النهاية", excerpt: "سباق شهد منافسة قوية على آخر كيلومترات وسط حضور جماهيري غير مسبوق وسط المدينة.", categoryId: catSports, imageUrl: "https://images.unsplash.com/photo-1565992441121-4367c2967103?q=80&w=627&auto=format&fit=crop" },
    { title: "الدوري يعلن مواعيد الجولة القادمة مع نقل مباراة إلى ملعب محايد", excerpt: "قرار يهدف إلى ضمان السلامة بعد صيانة أرضية أحد الملاعب، مع تحديث التذاكر إلكترونياً.", categoryId: catSports, imageUrl: "https://images.unsplash.com/photo-1530549387789-4c1017266635?q=80&w=1170&auto=format&fit=crop" },
    { title: "لاعبة التنس تبلغ ربع النهائي بعد فوزها العنيد على المصنّفة الثالثة", excerpt: "مباراة امتدت لثلاث مجموعات قاسية، وأظهرت اللاعبة تركيزاً عالياً في الكرات الحاسمة.", categoryId: catSports, imageUrl: "https://images.unsplash.com/photo-1607627000458-210e8d2bdb1d?q=80&w=1149&auto=format&fit=crop" },
    { title: "نادي السلة يمدّد عقد مدربه قبل انطلاق دور المجموعات القاري", excerpt: "إدارة النادي تشيد بالاستقرار الفني وتخطط لتعزيز التصويب من خارج القوس في الميركاتو الشتوي.", categoryId: catSports, imageUrl: "https://images.unsplash.com/photo-1471295253337-3ceaaedca402?q=80&w=1168&auto=format&fit=crop" },
    // Tech
    { title: "شركات الشّرائح تستعد لجولة استثمارات جديدة قبل موسم الأجهزة الذكية", excerpt: "تقارير تشير إلى طلب متزايد على معالجات الطاقة المنخفضة للأجهزة المحمولة والمنزلية المتصلة.", categoryId: catTech, imageUrl: "https://images.unsplash.com/photo-1518770660439-4636190af475?q=80&w=1170&auto=format&fit=crop" },
    { title: "خبراء الأمن يحذّرون من حملات تصيّد تستهدف حسابات الشركات الصغيرة", excerpt: "يوصون بتفعيل التحقق بخطوتين وتدريب الموظفين على التحقق من روابط البريد قبل النقر.", categoryId: catTech, imageUrl: "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?q=80&w=1170&auto=format&fit=crop" },
    { title: "استطلاع: ثلث المستخدمين يعتمدون على خدمات سحابية لمزامنة ملفات العمل يومياً", excerpt: "النسخ الاحتياطي التلقائي وتطبيقات التعاون اللحظي يقلّلان فقدان البيانات في الفرق البعيدة.", categoryId: catTech, imageUrl: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=1172&auto=format&fit=crop" },
    { title: "لوحات تحكم ذكية توحّد بيانات المبيعات والمخزون لمتاجر التجزئة", excerpt: "تكامل أسرع مع أنظمة الدفع يساعد المتاجر على ضبط الطلب الموسمي وتقليل الهدر.", categoryId: catTech, imageUrl: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?q=80&w=1170&auto=format&fit=crop" },
    { title: "مختبرات محلية تطلق نموذجاً لغوياً يدعم العربية في السياقات التقنية المتخصصة", excerpt: "خطوة تهدف إلى تحسين ملخصات الوثائق والدعم الآلي للشركات الناشئة في المنطقة.", categoryId: catTech, imageUrl: "https://images.unsplash.com/photo-1677442136019-21780ecad995?q=80&w=1170&auto=format&fit=crop" },
  ]

  let created = 0
  let skipped = 0
  for (const data of all) {
    if (existingTitles.has(data.title)) {
      console.log(`  SKIP (duplicate): ${data.title}`)
      skipped++
      continue
    }
    const id = randomUUID()
    console.log(`\n  Processing: ${data.title}`)
    const coverImageUrl = await uploadImage(data.imageUrl, id)
    await insertArticle(id, data.title, data.excerpt, makeBody(data.excerpt), data.categoryId, coverImageUrl)
    existingTitles.add(data.title)
    created++
    console.log(`  ✓ Created`)
  }

  console.log(`\nDone! Created ${created}, skipped ${skipped}.\n`)
}

type ArticleSeed = {
  title: string
  excerpt: string
  categoryId: string | null
  imageUrl: string
}

main().catch((err) => {
  console.error("Seed failed:", err)
  process.exit(1)
})
