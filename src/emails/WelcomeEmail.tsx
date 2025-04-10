import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Link,
  Preview,
  Section,
  Text,
} from '@react-email/components';
import React from 'react';

interface WelcomeEmailProps {
  userName?: string | null;
  storeName?: string;
  storeUrl?: string;
}

const baseUrl = process.env.STORE_URL || 'http://localhost:3000'; // Backend/API URL
const frontendBaseUrl = "https://coffee-craft.vercel.app"; // Your Vercel frontend URL
const defaultStoreName = 'Coffee Craft';

export const WelcomeEmail = ({
  userName,
  storeName = defaultStoreName,
  storeUrl = frontendBaseUrl, // Link to frontend by default
}: WelcomeEmailProps) => {
  const previewText = `Chào mừng bạn đến với ${storeName}!`;

  return (
    <Html>
      <Head />
      <Preview>{previewText}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={headerSection}>
             <Text style={logoText}>
                <span style={logoCoffee}>Coffee</span><span style={logoCraft}>Craft</span>
             </Text>
          </Section>
          <Heading style={heading}>Chào mừng bạn đến với {storeName}!</Heading>
          <Section style={contentSection}>
            <Text style={paragraph}>
              Xin chào {userName || 'bạn'},
            </Text>
            <Text style={paragraph}>
              Cảm ơn bạn đã đăng ký tài khoản tại {storeName}. Chúng tôi rất vui khi có bạn đồng hành!
            </Text>
            <Text style={paragraph}>
              Hãy khám phá các sản phẩm cà phê tuyệt vời và các ưu đãi đặc biệt của chúng tôi.
            </Text>
            <Section style={buttonContainer}>
              <Button style={button} href={storeUrl}>
                Bắt đầu mua sắm
              </Button>
            </Section>
          </Section>

          <Section style={footer}>
             <Text style={footerText}>
              Nếu bạn có bất kỳ câu hỏi nào, vui lòng liên hệ với chúng tôi tại{' '}
              <Link href={`mailto:support@coffeecraft.com`} style={link}> {/* Hardcode support email or use env var */}
                support@coffeecraft.com
              </Link>
              .
            </Text>
            <Text style={footerText}>
              © {new Date().getFullYear()} {storeName}
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
};

export default WelcomeEmail;

// --- Styles (Adjusted Spacing) ---
const main = {
  backgroundColor: "#ffffff",
  fontFamily: '"Helvetica Neue",Helvetica,Arial,sans-serif',
};

const container = {
  backgroundColor: "#ffffff",
  margin: "0 auto",
  padding: "20px 0 48px", // Increased top/bottom padding
  marginBottom: "64px",
  maxWidth: "600px", // Slightly narrower container
};

const headerSection = {
    padding: "20px",
    borderBottom: "1px solid #e6e6e6",
};

const logoText = {
    fontSize: "28px",
    fontWeight: "bold",
    textAlign: "center" as const,
    margin: "0",
    padding: "10px 0",
};
const logoCoffee = {
    color: "#1a1a1a",
};
const logoCraft = {
    color: "#f5a623", // Keep accent color
};

const contentSection = {
    padding: "0px 40px", // Increased padding
};

const heading = {
  fontSize: "24px",
  fontWeight: "bold",
  textAlign: "center" as const,
  color: "#1a1a1a",
  margin: "30px 0", // Increased top/bottom margin
};

const paragraph = {
  fontSize: "14px",
  lineHeight: "24px", // Slightly increased line height
  color: "#333333",
  margin: "0 0 20px 0", // Increased bottom margin
};

const buttonContainer = {
    textAlign: "center" as const,
    margin: "30px 0", // Increased margin
};

const button = {
  backgroundColor: "#f5a623",
  borderRadius: "4px",
  color: "#ffffff",
  fontSize: "16px",
  fontWeight: "bold",
  textDecoration: "none",
  textAlign: "center" as const,
  display: "inline-block",
  padding: "12px 30px",
  border: "none",
};


const footer = {
  padding: "20px 30px",
  marginTop: "10px",
  borderTop: "1px solid #e6e6e6",
};

const footerText = {
  fontSize: "12px",
  color: "#888888",
  lineHeight: "18px",
  textAlign: "center" as const,
  marginBottom: "10px",
};

const link = {
  color: "#007bff",
  textDecoration: "none",
};