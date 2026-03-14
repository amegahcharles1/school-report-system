import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export const authOptions: NextAuthOptions = {
  providers: [
    // Teachers and admins authenticate via email/password
    CredentialsProvider({
      name: "Teacher / Admin",
      credentials: {
        email: { label: "Email", type: "email", placeholder: "admin@school.com" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        });

        if (!user) {
          return null;
        }

        const isPasswordValid = await bcrypt.compare(
          credentials.password,
          user.password
        );

        if (!isPasswordValid) {
          return null;
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          mustChangePassword: user.mustChangePassword,
        };
      },
    }),

    // Students authenticate via student ID and PIN
    CredentialsProvider({
      name: "Student",
      credentials: {
        studentId: { label: "Student ID", type: "text", placeholder: "stu_abc123" },
        pin: { label: "PIN", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.studentId || !credentials?.pin) {
          return null;
        }

        const student = await prisma.student.findUnique({
          where: { id: credentials.studentId },
        });

        if (!student || !student.pin) {
          return null;
        }

        const isPinValid = await bcrypt.compare(credentials.pin, student.pin);
        if (!isPinValid) {
          return null;
        }

        return {
          id: student.id,
          name: `${student.lastName} ${student.firstName}`,
          role: 'STUDENT',
          studentId: student.id,
        };
      },
    }),
  ],
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        // @ts-ignore
        token.role = user.role;
        // @ts-ignore
        token.id = user.id;
        // @ts-ignore
        token.studentId = user.studentId;
        // @ts-ignore
        token.mustChangePassword = user.mustChangePassword;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        // @ts-ignore
        session.user.role = token.role as string;
        // @ts-ignore
        session.user.id = token.id as string;
        // @ts-ignore
        session.user.studentId = token.studentId as string;
        // @ts-ignore
        session.user.mustChangePassword = token.mustChangePassword as boolean;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
  secret: process.env.NEXTAUTH_SECRET || "fallback-secret-for-dev",
};
