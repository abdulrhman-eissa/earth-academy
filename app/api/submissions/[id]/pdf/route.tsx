import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { currentSession } from "@/lib/auth";
import { renderToBuffer, Document, Page, Text, View, StyleSheet, Font } from "@react-pdf/renderer";
import path from "path";
import fs from "fs";

// ============================================================
// تسجيل الخطوط العربية
// ============================================================
const fontsDir = path.join(process.cwd(), "public", "fonts");

try {
  if (fs.existsSync(path.join(fontsDir, "Amiri-Regular.ttf"))) {
    Font.register({
      family: "Amiri",
      fonts: [
        { src: path.join(fontsDir, "Amiri-Regular.ttf"), fontWeight: "normal" },
        { src: path.join(fontsDir, "Amiri-Bold.ttf"), fontWeight: "bold" },
      ],
    });
  }
} catch (e) {
  console.error("[pdf] font registration failed:", e);
}

// ============================================================
// Styles
// ============================================================
const styles = StyleSheet.create({
  page: {
    fontFamily: "Amiri",
    fontSize: 14,
    lineHeight: 1.8,
    paddingTop: 60,
    paddingBottom: 60,
    paddingHorizontal: 60,
    direction: "rtl",
  },
  header: {
    position: "absolute",
    top: 25,
    left: 60,
    right: 60,
    textAlign: "center",
    fontSize: 11,
    color: "#1e5eb8",
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
    paddingBottom: 8,
  },
  footer: {
    position: "absolute",
    bottom: 25,
    left: 60,
    right: 60,
    textAlign: "center",
    fontSize: 10,
    color: "#9ca3af",
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
    paddingTop: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 20,
    color: "#111827",
  },
  meta: {
    fontSize: 11,
    textAlign: "center",
    color: "#4b5563",
    marginBottom: 30,
    lineHeight: 1.6,
  },
  hr: {
    borderBottomWidth: 2,
    borderBottomColor: "#1e5eb8",
    width: 60,
    marginBottom: 30,
    marginHorizontal: "auto",
  },
  content: {
    fontSize: 14,
    lineHeight: 1.9,
    textAlign: "right",
    color: "#1f2937",
  },
  paragraph: {
    marginBottom: 10,
    textAlign: "right",
  },
  heading1: {
    fontSize: 20,
    fontWeight: "bold",
    marginTop: 16,
    marginBottom: 10,
    color: "#111827",
  },
  heading2: {
    fontSize: 17,
    fontWeight: "bold",
    marginTop: 14,
    marginBottom: 8,
    color: "#111827",
  },
  heading3: {
    fontSize: 15,
    fontWeight: "bold",
    marginTop: 12,
    marginBottom: 6,
    color: "#111827",
  },
  bold: { fontWeight: "bold" },
  italic: { fontStyle: "italic" },
});

// ============================================================
// HTML → نص عادي بأسلوب بسيط
// ============================================================
interface TextBlock {
  type: "p" | "h1" | "h2" | "h3" | "li";
  text: string;
  bold?: boolean;
  italic?: boolean;
  align?: string;
}

function htmlToBlocks(html: string): TextBlock[] {
  if (!html) return [];

  const blocks: TextBlock[] = [];

  // نقسم حسب عناصر الكتلة
  const parts = html.split(/<\/(p|h1|h2|h3|li|div|blockquote)>/i);

  for (const part of parts) {
    if (!part || !part.trim()) continue;

    // نلاقي الوسم
    const tagMatch = part.match(/<(p|h1|h2|h3|li|div|blockquote)[^>]*>/i);
    if (!tagMatch) continue;

    const tag = tagMatch[1].toLowerCase();
    let content = part.replace(/<[^>]+>/g, "").trim();

    // فك الكيانات
    content = content
      .replace(/&nbsp;/g, " ")
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'");

    if (!content) continue;

    const type: TextBlock["type"] =
      tag === "h1" ? "h1" :
      tag === "h2" ? "h2" :
      tag === "h3" ? "h3" :
      tag === "li" ? "li" : "p";

    const alignMatch = part.match(/text-align:\s*(right|center|left|justify)/i);

    blocks.push({
      type,
      text: content,
      bold: /<strong|<b>/i.test(part),
      italic: /<em|<i>/i.test(part),
      align: alignMatch?.[1] ?? "right",
    });
  }

  return blocks;
}

// ============================================================
// GET: توليد PDF
// ============================================================
export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const session = await currentSession();
  if (!session) return NextResponse.json({ error: "يجب تسجيل الدخول" }, { status: 401 });

  const { id } = await context.params;

  const submission = await prisma.submission.findUnique({
    where: { id },
    select: {
      id: true,
      text: true,
      htmlContent: true,
      submittedAt: true,
      student: {
        select: {
          email: true,
          studentProfile: { select: { fullName: true, studentCode: true, academicLevel: true } },
        },
      },
      assignment: {
        select: {
          title: true,
          course: true,
          facultyId: true,
          faculty: { select: { facultyProfile: { select: { fullName: true, academicTitle: true } } } },
        },
      },
    },
  });

  if (!submission) return NextResponse.json({ error: "غير موجود" }, { status: 404 });

  // صلاحيات
  const allowed =
    session.role === "ADMIN" ||
    session.role === "AFFAIRS" ||
    (session.role === "FACULTY" && submission.assignment.facultyId === session.userId) ||
    (session.role === "STUDENT" && submission.student.email === `${session.userId}`);

  // مبسّط: نسمح للمالك والأستاذ والأدمن
  if (!allowed && session.role === "FACULTY" && submission.assignment.facultyId !== session.userId) {
    return NextResponse.json({ error: "غير مصرح" }, { status: 403 });
  }

  const studentName = submission.student.studentProfile?.fullName ?? submission.student.email;
  const studentCode = submission.student.studentProfile?.studentCode ?? "—";
  const docName = submission.assignment.faculty.facultyProfile?.fullName ?? "—";
  const docTitle = submission.assignment.faculty.facultyProfile?.academicTitle ?? "";

  // نستخدم htmlContent لو موجود، وإلا text
  const html = submission.htmlContent || `<p>${submission.text}</p>`;
  const blocks = htmlToBlocks(html);

  const submittedDate = new Date(submission.submittedAt).toLocaleDateString("ar-EG");

  const doc = (
    <Document
      title={submission.assignment.title}
      author={studentName}
      subject={submission.assignment.course}
      creator="EARTH Academic System"
    >
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header} fixed>
          <Text>جامعة الأزهر الشريف — كلية اللغة العربية بالقاهرة — قسم التاريخ والحضارة</Text>
        </View>

        {/* Title */}
        <View>
          <Text style={styles.title}>{submission.assignment.title}</Text>
          <View style={styles.hr} />
          <Text style={styles.meta}>
            الطالب: {studentName} ({studentCode}){"\n"}
            المادة: {submission.assignment.course}  |  أستاذ المادة: {docTitle} {docName}{"\n"}
            تاريخ التسليم: {submittedDate}
          </Text>
        </View>

        {/* Content */}
        <View style={styles.content}>
          {blocks.length === 0 ? (
            <Text style={styles.paragraph}>{submission.text}</Text>
          ) : (
            blocks.map((b, i) => {
              const textStyle = [
                b.type === "h1" ? styles.heading1 :
                b.type === "h2" ? styles.heading2 :
                b.type === "h3" ? styles.heading3 :
                styles.paragraph,
                b.bold ? styles.bold : {},
                b.italic ? styles.italic : {},
              ];
              const prefix = b.type === "li" ? "• " : "";
              return (
                <Text key={i} style={textStyle}>
                  {prefix}{b.text}
                </Text>
              );
            })
          )}
        </View>

        {/* Footer */}
        <View style={styles.footer} fixed>
          <Text>منظومة EARTH الأكاديمية — صفحة (سيتم ترقيمها تلقائياً)</Text>
        </View>
      </Page>
    </Document>
  );

  try {
    const buffer = await renderToBuffer(doc);

    return new NextResponse(buffer as unknown as BodyInit, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="research-${id}.pdf"`,
        "Cache-Control": "private, max-age=3600",
      },
    });
  } catch (e) {
    console.error("[pdf] render failed:", e);
    return NextResponse.json({ error: "تعذر توليد PDF" }, { status: 500 });
  }
}
