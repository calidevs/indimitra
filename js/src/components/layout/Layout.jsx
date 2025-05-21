import { Box, Container } from '@components';
import Header from './Header';
import WhatsAppButton from '../common/WhatsAppButton';

const Layout = ({ children }) => {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Header />
      {/* <Container component="main" sx={{ flex: 1 }}> */}
      {children}
      {/* </Container> */}
      <WhatsAppButton />
    </Box>
  );
};

export default Layout;
