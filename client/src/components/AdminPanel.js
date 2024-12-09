import React, {useState} from 'react';
import { Tabs, Tab, Box, Container } from '@mui/material';
import TabPanel from './TabPanel'
import BuscarReservas from './BuscarReservas';
import ReporteDiario from './ReporteDiario';
import CargarReservas from './CargarReservas';
import BloquearAcceso from './BloquearAcceso';

function AdminPanel() {
  const [selectedTab, setSelectedTab] = useState(0);

  const handleChange = (e, newValue) => {
    setSelectedTab(newValue);
  };

    return (
        <Container maxWidth="md" sx={{ minHeight: '80vh', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <Box sx={{ display: 'flex', justifyContent: 'center', borderBottom: 0, borderColor: 'divider'}}>
                <Tabs value={selectedTab} onChange={handleChange} aria-label="Panel de Administración" centered>
                    <Tab label="Buscar Reserva" />
                    <Tab label="Reporte Diario" />
                    <Tab label="Cargar Reservas" />
                </Tabs>
            </Box>
            <TabPanel value={selectedTab} index={0}>
                <BuscarReservas />
            </TabPanel>
            <TabPanel value={selectedTab} index={1}>
                <ReporteDiario />
            </TabPanel>
            <TabPanel value={selectedTab} index={2}>
                <CargarReservas />
            </TabPanel>
            <Box mt={4} textAlign="center">
                <BloquearAcceso />
            </Box>
        </Container>);
}


export default AdminPanel;