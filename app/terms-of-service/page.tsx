import type { Metadata } from "next"
import Link from "next/link"
import { LegalPage, LegalTable } from "@/components/legal-page"

export const metadata: Metadata = { title: "Terms of Service — Lumen" }

// Draft: the [bracketed] parts are still to be confirmed, and an attorney should review it before launch.
export default function TermsPage() {
  return (
    <LegalPage title="Terms of Service" effective="[EFFECTIVE DATE]">
      <h2>1. Acceptance of these Terms</h2>
      <p>
        These Terms of Service (&quot;Terms&quot;) are an agreement between you and [LEGAL ENTITY NAME] (&quot;Lumen&quot;, &quot;we&quot;,
        &quot;us&quot;). They govern your use of the Lumen website, its courses and its related features (the &quot;Service&quot;).
      </p>
      <p>
        By using the Service, signing in or making a purchase, you agree to these Terms. If you don&apos;t agree, don&apos;t use the Service.
        Our <Link href="/privacy">Privacy Policy</Link> explains how we handle personal data.
      </p>

      <h2>2. Eligibility</h2>
      <p>
        You must be at least [16] years old to use the Service. To buy anything, you must be old enough to enter a binding contract where
        you live, or have a parent or guardian&apos;s permission to buy.
      </p>
      <p>
        You may not use the Service where the law prohibits it, or if we have previously terminated your account for breaking these Terms.
      </p>

      <h2>3. Your account</h2>
      <p>
        You don&apos;t need an account to browse courses or watch free preview lessons. You need an account to track progress, join lesson
        discussions, use the AI tutor and make purchases.
      </p>
      <p>
        You sign in with a Google or GitHub account. Your first sign-in creates your Lumen account, and we receive your name, email address
        and profile picture from that provider. We have no separate Lumen password.
      </p>
      <p>You are responsible for:</p>
      <ul>
        <li>keeping your Google or GitHub account secure, because anyone who controls it can sign in to Lumen as you;</li>
        <li>everything done through your Lumen account;</li>
        <li>telling us at [SUPPORT EMAIL] if you believe someone else has accessed it.</li>
      </ul>
      <p>Your account and your purchases are for you alone. Don&apos;t share your account or let others watch paid courses through it.</p>

      <h2>4. The Service</h2>
      <p>
        Lumen offers project-based video courses for software developers. Courses are made of lessons, and each lesson can include a
        video, written notes and a discussion.
      </p>
      <ul>
        <li>
          <strong>Free preview lessons</strong> are marked in each course&apos;s curriculum. Anyone can watch them, without an account.
        </li>
        <li>
          <strong>Paid lessons</strong> unlock with a purchase or plan (section 5).
        </li>
        <li>
          <strong>Progress tracking</strong> saves where you stopped and which lessons you completed, while you are signed in.
        </li>
        <li>
          <strong>Lesson discussions</strong> let signed-in learners post questions and replies (section 8).
        </li>
        <li>
          <strong>The AI tutor</strong> answers questions about a lesson (section 9).
        </li>
      </ul>
      <p>
        We may update, reorder, replace or remove lessons and courses. When we retire a course that someone paid for, we archive it
        instead of deleting it: it leaves the catalog, but people with access can keep watching it. We may also add, change or stop
        offering features.
      </p>

      <h2>5. Purchases, plans and billing</h2>
      <p>Lumen sells three options. The current price, currency and any tax are shown at checkout before you pay.</p>
      <LegalTable
        head={["Option", "How you pay", "What it unlocks", "How long access lasts"]}
        rows={[
          ["Single course", "One payment", "Every lesson in that one course", "For as long as we operate the Service (see “What lifetime means”)"],
          ["Monthly", "A recurring monthly payment, until you cancel", "Every course on Lumen, including courses added later", "While your subscription is active"],
          ["Lifetime", "One payment", "Every course on Lumen, current and future", "For as long as we operate the Service"],
        ]}
      />
      <p>Some courses are not sold on their own and are available only through Monthly or Lifetime.</p>

      <h3>Payments through Polar</h3>
      <p>
        Checkout, payment processing, sales tax and VAT, receipts and billing management are handled by Polar (polar.sh). [Polar acts as
        reseller and merchant of record: you buy from Polar, and Polar&apos;s own terms also apply to your payment.] We never see or store
        your card details.
      </p>
      <p>
        You must be signed in to buy. When you check out, we send Polar your name, email address and Lumen account ID so the purchase is
        linked to your account.
      </p>
      <p>
        Access starts once Polar confirms your payment to us, which is usually within moments. If you have paid and your access
        hasn&apos;t appeared, contact [SUPPORT EMAIL].
      </p>
      <p>You can&apos;t buy what you already have:</p>
      <ul>
        <li>With Lifetime, there is nothing more to buy.</li>
        <li>With Monthly, the only option is upgrading to Lifetime.</li>
        <li>A course you already own can&apos;t be bought again.</li>
      </ul>
      <p>Earlier purchases are not credited toward Monthly or Lifetime.</p>

      <h3>Monthly subscription</h3>
      <ul>
        <li>
          <strong>Renewal.</strong> Monthly renews automatically and charges your payment method each billing period until you cancel.
        </li>
        <li>
          <strong>Cancelling.</strong> Cancel at any time in Billing, from the account menu. Cancelling stops future renewals, and you keep
          access until the end of the period you&apos;ve paid for.
        </li>
        <li>
          <strong>Failed payments.</strong> If a renewal payment fails, Polar retries it and you keep access while it does. If the payment
          isn&apos;t recovered, your subscription and your access end.
        </li>
        <li>
          <strong>Upgrading to Lifetime.</strong> When you buy Lifetime, we set your Monthly subscription to cancel at the end of its
          current period, so you are not charged again. The current period is not refunded or prorated.
        </li>
      </ul>

      <h3>What &quot;lifetime&quot; means</h3>
      <p>
        &quot;Lifetime access&quot; to a single course, and the Lifetime plan, mean access for as long as we operate the Service. They
        don&apos;t mean for your lifetime, or for any fixed number of years.
      </p>
      <p>
        We may update, replace or remove individual lessons. A course you paid for is archived rather than deleted, so it stays available
        to you after it leaves the catalog. [If we stop operating the Service, we will give at least [60] days&apos; notice.]
      </p>

      <h3>Refunds</h3>
      <p>
        [REFUND POLICY: for example, &quot;You can request a refund of a one-time purchase within [14] days of payment by writing to
        [SUPPORT EMAIL]. Monthly payments are non-refundable, except where the law requires otherwise.&quot;]
      </p>
      <p>
        A full refund ends the access that the refunded purchase gave you. A partial refund does not change your access. If we refund a
        Monthly payment, we may also end that subscription.
      </p>
      <p>
        [EU/UK CONSUMERS: statutory right of withdrawal for digital content, and how you consent to immediate access at checkout.]
      </p>

      <h3>Price changes</h3>
      <p>
        We may change prices. A change never affects a purchase you have completed or a billing period you have already paid for. [We
        will tell Monthly subscribers at least [30] days before a new price applies to their renewal.]
      </p>

      <h3>Receipts and billing details</h3>
      <p>
        Receipts, invoices and payment methods are in Billing, which opens Polar&apos;s customer portal. Billing becomes available after
        your first purchase.
      </p>

      <h2>6. Your license to course content</h2>
      <p>
        While you have access to a lesson, we grant you a personal, non-exclusive, non-transferable, revocable license to stream its
        video and read its notes through the Service, for your own learning.
      </p>
      <p>
        Videos are streamed through time-limited links and are not offered for download. You may not copy, download, record,
        redistribute, sell, rent or sublicense course videos or notes, or use them to build a competing course.
      </p>
      <p>
        <strong>Source code.</strong> Where a lesson&apos;s notes include source code or link to it, [you may use that code in your own
        projects, including commercial ones. You may not republish it as course or teaching material, or offer it as a substitute for the
        course.]
      </p>

      <h2>7. Acceptable use</h2>
      <p>When you use the Service, you must not:</p>
      <ul>
        <li>share your account, resell access, or let others watch paid lessons through your account;</li>
        <li>download or screen-record videos, or use the video links our player receives anywhere outside the Service;</li>
        <li>get around access controls, for example to unlock paid lessons, obtain links to other files, or reach administrator pages;</li>
        <li>scrape the Service, or access it with bots or scripts, other than search engines indexing public pages;</li>
        <li>automate the AI tutor, try to extract its instructions, or use it to get at paid lessons you haven&apos;t unlocked;</li>
        <li>post anything unlawful, harassing, hateful, sexually explicit, or infringing, or any spam or advertising;</li>
        <li>post other people&apos;s personal information, or secrets such as passwords and API keys;</li>
        <li>overload, probe or disrupt the Service or its security;</li>
        <li>impersonate anyone, or misrepresent your connection with anyone.</li>
      </ul>
      <p>
        Some limits are enforced automatically, such as the AI tutor&apos;s daily limit and the length of posts. We may investigate
        suspected breaches and act under section 15.
      </p>

      <h2>8. Lesson discussions and your posts</h2>
      <p>
        <strong>Who can post.</strong> Signed-in users can post questions, and replies to questions, in the discussion of any lesson they
        can watch. Each post can be up to 2,000 characters.
      </p>
      <p>
        <strong>Who can see posts.</strong> Anyone who can watch a lesson can read its discussion. For free preview lessons, that includes
        visitors who aren&apos;t signed in. Your name and profile picture from Google or GitHub appear next to your posts.
      </p>
      <p>
        <strong>AI answers.</strong> Any signed-in user who can post in a discussion can ask the AI tutor to answer a question there,
        including yours. The answer is posted publicly under that question and labeled as written by AI, once per question.
      </p>
      <p>
        <strong>Your rights in your posts.</strong> You keep ownership of what you post. You grant us a worldwide, non-exclusive,
        royalty-free license to host, store, copy, display and distribute your posts within the Service, and to share them with our
        service providers as needed to run it. This includes sending a question to our AI provider when someone asks the AI tutor to
        answer it. The license ends when the post is removed from the Service.
      </p>
      <p>
        <strong>Your responsibility.</strong> You are responsible for your posts, and you must have the right to post them.
      </p>
      <p>
        <strong>Editing and removal.</strong> You can&apos;t currently edit or delete your own posts. To have one removed, email [SUPPORT
        EMAIL]. We may remove any post that breaks these Terms or the law.
      </p>
      <p>
        When a question is removed, every reply under it is removed too, including other people&apos;s replies and the AI answer. The same
        happens when you delete your account (section 15) or when a lesson is removed.
      </p>
      <p>
        <strong>Reporting.</strong> To report a post, or content you believe infringes your rights, email [SUPPORT EMAIL] with a link to it
        and the reason.
      </p>

      <h2>9. The AI tutor</h2>
      <p>
        The AI tutor is an automated assistant that answers questions about the lesson you&apos;re watching. It is available to signed-in
        users on lessons they can watch, in the &quot;Ask the tutor&quot; panel and through &quot;Ask AI&quot; in lesson discussions.
      </p>
      <p>
        <strong>How it works.</strong> The tutor runs on a third-party AI model, currently from OpenAI. To answer, we send the model your
        messages, the lesson&apos;s notes and the course outline. In the chat, that outline also shows which lessons you have completed. The
        tutor may also read the notes of other lessons you can watch. It never reads paid lessons you haven&apos;t unlocked, and answers
        posted in a discussion draw only on lessons everyone in that discussion can watch. When the notes don&apos;t cover something, it may
        answer from general knowledge.
      </p>
      <p>
        <strong>Chat history.</strong> Tutor chats are not saved to your account. Reloading the page, or moving to another lesson, starts
        a new chat.
      </p>
      <p>
        <strong>Limits.</strong> Each account gets up to 100 AI answers per day, shared between the chat and &quot;Ask AI&quot;, and the
        count resets at midnight UTC. A single chat also has a maximum length; once you reach it, start a new chat. We may change these
        limits.
      </p>
      <p>
        <strong>The tutor can be wrong.</strong> Answers are generated automatically and are not reviewed by a person before you see them.
        They may be inaccurate, incomplete, outdated or insecure. Check them, and especially any code, before relying on them. The tutor is
        a study aid, not professional, legal, financial or security advice.
      </p>
      <p>
        <strong>What you send.</strong> Don&apos;t put personal data, passwords, API keys or other secrets in your questions. Our
        error-monitoring provider records tutor conversations, including your messages and the answers, so we can diagnose problems (see
        our <Link href="/privacy">Privacy Policy</Link>). You must not use the tutor in ways that break OpenAI&apos;s usage policies.
      </p>
      <p>
        <strong>Using answers.</strong> Answers aren&apos;t unique, and other people may receive similar ones. Subject to these Terms, you
        may use the answers you receive for any lawful purpose.
      </p>

      <h2>10. Our intellectual property</h2>
      <p>
        The Service belongs to us or our licensors and is protected by intellectual property laws. That includes the Lumen name and logo,
        the website&apos;s design, and every course, video, lesson note and other material we provide. Apart from the licenses in sections 6
        and 9, these Terms give you no rights in it.
      </p>
      <p>If you send us feedback or suggestions, we may use them freely, with no obligation to you.</p>

      <h2>11. Third-party services</h2>
      <p>
        The Service relies on the providers below. When you use one directly, for example to sign in or to pay, its own terms and privacy
        policy also apply to you. We are not responsible for services we don&apos;t control.
      </p>
      <LegalTable
        head={["Provider", "What it does for Lumen", "Whether you deal with it directly"]}
        rows={[
          ["Google, GitHub", "Sign-in", "Yes, when you sign in"],
          ["Polar", "Checkout, payments, tax, receipts, subscription management", "Yes, at checkout and in Billing"],
          ["OpenAI", "The AI model behind the tutor", "No; we send it tutor questions and lesson material"],
          ["ImageKit", "Stores and streams course videos and images", "No"],
          ["Neon", "Database and sign-in sessions", "No"],
          ["Sentry", "Error monitoring, performance tracing and session replay", "No"],
          ["[HOSTING PROVIDER]", "Hosts the website", "No"],
        ]}
      />
      <p>
        If a provider changes or stops its service, a feature that depends on it may change or stop too. We may replace providers without
        notice.
      </p>

      <h2>12. Disclaimers</h2>
      <p>
        The Service is provided &quot;as is&quot; and &quot;as available&quot;. To the fullest extent the law allows, we disclaim all
        implied warranties, including merchantability, fitness for a particular purpose, title and non-infringement.
      </p>
      <p>In particular, we don&apos;t promise that:</p>
      <ul>
        <li>the Service will be uninterrupted or error-free, or that every video will always play;</li>
        <li>course content will stay current as tools and frameworks change;</li>
        <li>taking a course will lead to any result, such as a job, a promotion or a working product.</li>
      </ul>
      <p>
        Code in courses and in AI answers is provided for learning. Review, test and secure any code before you use it in production; you
        are responsible for that use.
      </p>
      <p>Nothing in these Terms limits rights you have under consumer protection laws that can&apos;t be waived.</p>

      <h2>13. Limitation of liability</h2>
      <p>To the fullest extent the law allows:</p>
      <ul>
        <li>
          We are not liable for indirect, incidental, special, consequential or punitive damages, or for lost profits, revenue, data or
          goodwill.
        </li>
        <li>
          Our total liability for all claims relating to the Service is limited to the greater of (a) what you paid for the Service in the
          12 months before the event that gave rise to the claim, and (b) [US$100].
        </li>
      </ul>
      <p>
        These limits don&apos;t apply where the law doesn&apos;t allow them to, such as liability for fraud, or for death or personal
        injury caused by negligence.
      </p>

      <h2>14. Indemnification</h2>
      <p>
        You agree to indemnify us against third-party claims, and the reasonable costs of defending them, that arise from your posts, your
        misuse of the Service or your breach of these Terms.
      </p>

      <h2>15. Suspension and termination</h2>
      <p>
        <strong>Leaving.</strong> You can stop using the Service at any time. To stop Monthly payments, cancel in Billing. To delete your
        account, email [SUPPORT EMAIL] from the address on your account; there is no self-serve deletion yet.
      </p>
      <p>
        <strong>What deleting your account does.</strong>
      </p>
      <ul>
        <li>It removes your profile, your progress, your discussion posts (and every reply under your questions) and your AI usage records.</li>
        <li>It ends your access to everything you bought, and those purchases can&apos;t be moved to another account.</li>
        <li>It does not cancel a Monthly subscription, so cancel that in Billing first.</li>
        <li>
          We keep records of your purchases and subscriptions [for accounting, tax and legal purposes, for [PERIOD]]. Polar keeps its own
          records under its terms.
        </li>
      </ul>
      <p>
        <strong>Suspension or termination by us.</strong> We may suspend or terminate your account, or restrict your access, if you
        materially breach these Terms, if the law requires it, or to protect the Service or other users. Sharing your account and getting
        around access controls are examples of material breaches. Where reasonable, we will tell you why [and give you a chance to
        respond].
      </p>
      <p>
        [If we terminate your account for breach, you are not entitled to a refund. If we terminate it for any other reason, we will refund
        [the unused part of the current Monthly period / REFUND TERMS].]
      </p>
      <p>
        <strong>What survives.</strong> Sections 6 (restrictions), 7, 10 and 12 to 18 survive the end of these Terms.
      </p>

      <h2>16. Changes to these Terms</h2>
      <p>
        We may update these Terms. We will post the new version here with a new effective date. For material changes, we will give at
        least [30] days&apos; notice [on the site and by email] before they take effect.
      </p>
      <p>
        If you keep using the Service after a change takes effect, you accept the new Terms. If you don&apos;t agree, stop using the
        Service, and cancel Monthly before the change applies. Changes never apply to disputes that arose before them.
      </p>

      <h2>17. Governing law and disputes</h2>
      <p>These Terms are governed by the laws of [JURISDICTION], without regard to conflict-of-law rules.</p>
      <p>
        Before bringing a claim, contact [SUPPORT EMAIL] and give us [30] days to try to resolve it informally. After that, the courts of
        [VENUE] have exclusive jurisdiction. If you are a consumer, you may also bring a claim in the courts where you live, and you keep
        the protection of the mandatory laws of your country.
      </p>

      <h2>18. General</h2>
      <ul>
        <li>
          <strong>Entire agreement.</strong> These Terms, our <Link href="/privacy">Privacy Policy</Link> and the terms shown at checkout
          are the whole agreement between you and us about the Service.
        </li>
        <li>
          <strong>Severability.</strong> If a court finds part of these Terms unenforceable, the rest stays in effect.
        </li>
        <li>
          <strong>No waiver.</strong> Not enforcing a right now doesn&apos;t mean we give it up.
        </li>
        <li>
          <strong>Assignment.</strong> You may not transfer these Terms or your account without our consent. We may transfer them as part
          of a merger, acquisition or sale of the Service, and your rights under them continue.
        </li>
      </ul>

      <h2>19. Contact</h2>
      <p>
        [LEGAL ENTITY NAME]
        <br />
        [REGISTERED ADDRESS]
        <br />
        Email: [SUPPORT EMAIL]
      </p>
    </LegalPage>
  )
}
