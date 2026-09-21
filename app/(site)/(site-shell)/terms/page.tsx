import type { Metadata } from "next"

import { ar } from "@/lib/ui-ar"

export const metadata: Metadata = {
  title: `شروط الاستخدام | ${ar.newsBrand}`,
  description: "الشروط والأحكام التي تحكم استخدامك منصة أخبار.",
}

type Section = { heading: string; body: string[] }

const SECTIONS: Section[] = [
  {
    heading: "قبول الشروط",
    body: [
      "باستخدامك موقع «أخبار» أو أي من خدماته، فإنك تقرّ بموافقتك على هذه الشروط والأحكام وعلى سياسة الخصوصية. إذا لم توافق على هذه الشروط، يُرجى عدم استخدام الموقع.",
    ],
  },
  {
    heading: "وصف الخدمة",
    body: [
      "يوفّر الموقع محتوى إخبارياً ومقالات ومعلومات في مجالات متعددة. وقد نضيف خدمات أو نعدّلها أو نوقفها في أي وقت دون إشعار مسبق.",
    ],
  },
  {
    heading: "استخدام المحتوى",
    body: [
      "المحتوى المنشور لأغراض الاطلاع الشخصي. يُمنع إعادة نشر المحتوى أو توزيعه أو تعديله أو استغلاله تجارياً دون إذن كتابي مسبق، مع الإشارة إلى المصدر عند السماح بذلك.",
    ],
  },
  {
    heading: "الملكية الفكرية",
    body: [
      "جميع العلامات التجارية والأسماء والشعارات والتصاميم والنصوص المنتجة داخلياً مملوكة للمنصة أو مرخّصة لها. أما المحتوى المستند إلى مصادر خارجية فيبقى ملكاً لأصحابه وفق حقوقهم.",
    ],
  },
  {
    heading: "سلوك المستخدم",
    body: [
      "تلتزم بعدم استخدام الموقع لأي غرض غير قانوني، وعدم محاولة اختراقه أو تعطيله، وعدم نشر محتوى مسيء أو مضلّل أو منتهك لحقوق الآخرين.",
    ],
  },
  {
    heading: "الاشتراكات والمدفوعات",
    body: [
      "قد تتضمن بعض الخدمات اشتراكات مدفوعة. تخضع هذه الاشتراكات لأسعارها وشروطها المعلنة عند الاشتراك، ولا تُرد المبالغ المدفوعة إلا حيث يقتضي القانون أو النص على خلاف ذلك.",
    ],
  },
  {
    heading: "إخلاء المسؤولية",
    body: [
      "نحرص على دقة المحتوى، لكننا لا نضمن خلوه من الأخطاء أو اكتماله أو ملاءمته لغرض معيّن. لا يقدّم المحتوى نصيحة مهنية أو قانونية أو مالية، ويُستخدم على مسؤوليتك الشخصية.",
    ],
  },
  {
    heading: "حدود المسؤولية",
    body: [
      "لا نتحمل مسؤولية أي أضرار مباشرة أو غير مباشرة أو عرضية ناتجة عن استخدامك الموقع أو تعذّر الوصول إليه أو اعتمادك على محتواه.",
    ],
  },
  {
    heading: "التعديلات",
    body: [
      "نحتفظ بحق تعديل هذه الشروط في أي وقت. تصبح التعديلات نافذةً عند نشرها على هذه الصفحة، ويُعدّ استمرار استخدامك للموقع موافقةً عليها.",
    ],
  },
  {
    heading: "القانون الواجب التطبيق",
    body: [
      "تخضع هذه الشروط وتُفسّر وفقاً للقوانين المعمول بها، وتكون الجهات المختصة صاحبة الاختصاص في أي نزاع ينشأ عنها.",
    ],
  },
  {
    heading: "التواصل معنا",
    body: [
      "لأي سؤال بشأن هذه الشروط، يمكنك التواصل معنا عبر صفحة «اتصل بنا».",
    ],
  },
]

export default function TermsPage() {
  return (
    <div className="flex-1 bg-white">
      <div
        dir="rtl"
        lang="ar"
        className="mx-auto w-full max-w-[90rem] px-4 py-12 sm:px-6 md:px-10 md:py-16 lg:px-8 lg:py-20"
      >
        <span className="inline-flex rounded-full border border-slate-200 bg-slate-50 px-4 py-1 text-xs font-bold uppercase tracking-[0.2em] text-slate-500">
          القانونية
        </span>
        <h1 className="mt-4 text-balance text-3xl font-black tracking-tight text-slate-950 md:text-5xl">
          شروط الاستخدام
        </h1>
        <p className="mt-4 max-w-2xl text-pretty text-[15px] leading-7 text-slate-600 md:text-base">
          آخر تحديث: سبتمبر 2026. يرجى قراءة هذه الشروط بعناية قبل استخدام منصة «
          {ar.newsBrand}».
        </p>

        <div className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-2 lg:gap-8">
          {SECTIONS.map((section) => (
            <section
              key={section.heading}
              className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm md:p-8"
            >
              <h2 className="text-xl font-bold text-slate-900 md:text-2xl">{section.heading}</h2>
              <div className="mt-3 space-y-3">
                {section.body.map((paragraph, i) => (
                  <p key={i} className="text-pretty text-[15px] leading-7 text-slate-600">
                    {paragraph}
                  </p>
                ))}
              </div>
            </section>
          ))}
        </div>
      </div>
    </div>
  )
}