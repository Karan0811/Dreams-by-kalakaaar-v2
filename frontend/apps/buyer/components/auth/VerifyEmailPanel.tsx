// "use client";

// import Link from "next/link";
// import { useEffect, useState } from "react";
// import { Alert, Button, FormField, Input } from "@dbk/ui";

// type VerificationState = "awaiting" | "verifying" | "verified" | "invalid" | "expired" | "error";

// function messageForResponse(response: Response, body: unknown): VerificationState {
//   const code = typeof body === "object" && body !== null && "code" in body
//     ? String(body.code)
//     : "";

//   if (code === "TOKEN_EXPIRED") return "expired";
//   if (code === "INVALID_TOKEN" || response.status === 401 || response.status === 400) return "invalid";
//   return "error";
// }

// export function VerifyEmailPanel({ token, initialEmail }: { token?: string; initialEmail?: string }) {
//   const [state, setState] = useState<VerificationState>(token ? "verifying" : "awaiting");
//   const [email, setEmail] = useState(initialEmail ?? "");
//   const [resendState, setResendState] = useState<"idle" | "sending" | "sent" | "error">("idle");

//   useEffect(() => {
//     if (!token) return;
//     const verificationToken = token;

//     let cancelled = false;
//     async function verify() {
//       try {
//         const response = await fetch(`/api/auth/verify-email?token=${encodeURIComponent(verificationToken)}`, {
//           credentials: "include",
//         });
//         const body: unknown = await response.json().catch(() => null);
//         if (!cancelled) setState(response.ok ? "verified" : messageForResponse(response, body));
//       } catch {
//         if (!cancelled) setState("error");
//       }
//     }

//     void verify();
//     return () => { cancelled = true; };
//   }, [token]);

//   async function resend(event: React.FormEvent<HTMLFormElement>) {
//     event.preventDefault();
//     setResendState("sending");
//     try {
//       const response = await fetch("/api/auth/send-verification-email", {
//         method: "POST",
//         credentials: "include",
//         headers: { "content-type": "application/json" },
//         body: JSON.stringify({ email, callbackURL: `${window.location.origin}/verify-email` }),
//       });
//       // The endpoint deliberately gives the same success response for unknown,
//       // verified, and unverified email addresses to prevent account enumeration.
//       setResendState(response.ok ? "sent" : "error");
//     } catch {
//       setResendState("error");
//     }
//   }

//   if (state === "verifying") {
//     return <p className="text-center text-[14px] text-text-secondary">Verifying your email address…</p>;
//   }

//   if (state === "verified") {
//     return (
//       <div className="flex flex-col gap-4">
//         <Alert variant="success" title="Email verified">Your account is ready to use.</Alert>
//         <Button asChild size="lg"><Link href="/account/dashboard">Continue to your account</Link></Button>
//       </div>
//     );
//   }

//   const problem = state === "expired"
//     ? "This verification link has expired. Request a new one below."
//     : state === "invalid"
//       ? "This verification link is invalid or has already been used. Request a new one below."
//       : state === "error"
//         ? "We couldn't verify this link right now. Please try again or request a new link."
//         : "Check your inbox for a verification link. It may take a few minutes to arrive.";

//   return (
//     <div className="flex flex-col gap-4">
//       <div>
//         <h1 className="font-serif text-[22px] text-text-primary">Verify your email</h1>
//         <p className="mt-1 text-[14px] text-text-secondary">{problem}</p>
//       </div>
//       {resendState === "sent" ? <Alert variant="success">If an eligible account exists, a new verification email is on its way.</Alert> : null}
//       {resendState === "error" ? <Alert variant="error">We couldn&apos;t send a new email. Please try again.</Alert> : null}
//       <form onSubmit={resend} className="flex flex-col gap-3">
//         <FormField id="email" label="Email address" required>
//           <Input id="email" type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
//         </FormField>
//         <Button type="submit" size="lg" isLoading={resendState === "sending"}>Resend verification email</Button>
//       </form>
//       <p className="text-center text-[13px] text-text-secondary"><Link href="/login" className="font-medium text-text-link hover:underline">Back to sign in</Link></p>
//     </div>
//   );
// }


"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Alert, Button, FormField, Input } from "@dbk/ui";

type VerificationState = "awaiting" | "verifying" | "verified" | "invalid" | "error";

export function VerifyEmailPanel({ token, initialEmail }: { token?: string; initialEmail?: string }) {
  const [state, setState] = useState<VerificationState>(token ? "verifying" : "awaiting");
  const [email, setEmail] = useState(initialEmail ?? "");
  const [resendState, setResendState] = useState<"idle" | "sending" | "sent" | "error">("idle");

  useEffect(() => {
    if (!token) return;
    const verificationToken = token;

    let cancelled = false;
    async function verify() {
      try {
        const response = await fetch("/api/session/verify-email", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token: verificationToken }),
        });
        if (cancelled) return;
        if (response.ok) {
          setState("verified");
          return;
        }
        setState(response.status === 401 || response.status === 400 ? "invalid" : "error");
      } catch {
        if (!cancelled) setState("error");
      }
    }

    void verify();
    return () => { cancelled = true; };
  }, [token]);

  async function resend(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setResendState("sending");
    try {
      const response = await fetch("/api/session/resend-verification", {
        method: "POST",
        credentials: "include",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email }),
      });
      // The endpoint deliberately gives the same success response for unknown,
      // verified, and unverified email addresses to prevent account enumeration.
      setResendState(response.ok ? "sent" : "error");
    } catch {
      setResendState("error");
    }
  }

  if (state === "verifying") {
    return <p className="text-center text-[14px] text-text-secondary">Verifying your email address…</p>;
  }

  if (state === "verified") {
    return (
      <div className="flex flex-col gap-4">
        <Alert variant="success" title="Email verified">Your account is ready to use.</Alert>
        <Button asChild size="lg"><Link href="/account/dashboard">Continue to your account</Link></Button>
      </div>
    );
  }

  const problem = state === "invalid"
    ? "This verification link is invalid, expired, or has already been used. Request a new one below."
    : state === "error"
      ? "We couldn't verify this link right now. Please try again or request a new link."
      : "Check your inbox for a verification link. It may take a few minutes to arrive.";

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="font-serif text-[22px] text-text-primary">Verify your email</h1>
        <p className="mt-1 text-[14px] text-text-secondary">{problem}</p>
      </div>
      {resendState === "sent" ? <Alert variant="success">If an eligible account exists, a new verification email is on its way.</Alert> : null}
      {resendState === "error" ? <Alert variant="error">We couldn&apos;t send a new email. Please try again.</Alert> : null}
      <form onSubmit={resend} className="flex flex-col gap-3">
        <FormField id="email" label="Email address" required>
          <Input id="email" type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
        </FormField>
        <Button type="submit" size="lg" isLoading={resendState === "sending"}>Resend verification email</Button>
      </form>
      <p className="text-center text-[13px] text-text-secondary"><Link href="/login" className="font-medium text-text-link hover:underline">Back to sign in</Link></p>
    </div>
  );
}