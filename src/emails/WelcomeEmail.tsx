import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Img,
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

          <Hr style={hr} />

          <Section style={footer}>
             <Text style={footerText}>
              Nếu bạn có bất kỳ câu hỏi nào, vui lòng liên hệ với chúng tôi tại{' '}
              <Link href={`mailto:support@coffeecraft.com`} style={link}> {/* Hardcode support email or use env var */}
                support@coffeecraft.com
              </Link>
              .
            </Text>
            <Text style={footerText}>
              © {new Date().getFullYear()} {storeName}. Bảo lưu mọi quyền.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
};

export default WelcomeEmail;

// --- Styles (Similar to Order Confirmation) ---
const main = {
  backgroundColor: "#ffffff",
  fontFamily: '"Helvetica Neue",Helvetica,Arial,sans-serif',
};

const container = {
  backgroundColor: "#ffffff",
  margin: "0 auto",
  padding: "0",
  marginBottom: "64px",
  maxWidth: "680px",
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
    color: "#f5a623",
};

const contentSection = {
    padding: "20px 30px",
};

const heading = {
  fontSize: "24px",
  fontWeight: "bold",
  textAlign: "center" as const,
  color: "#1a1a1a",
  margin: "20px 0",
};

const paragraph = {
  fontSize: "14px",
  lineHeight: "22px",
  color: "#333333",
  margin: "0 0 15px 0",
};

const buttonContainer = {
    textAlign: "center" as const,
    margin: "25px 0",
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

const hr = {
  borderColor: "#e6e6e6",
  margin: "20px 0", // Add margin for HR
};

const footer = {
  padding: "20px",
  marginTop: "20px",
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