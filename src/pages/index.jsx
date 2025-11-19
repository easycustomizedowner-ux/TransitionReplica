import Layout from "./Layout.jsx";

import Home from "./Home";

import GetStarted from "./GetStarted";

import CustomerDashboard from "./CustomerDashboard";

import VendorDashboard from "./VendorDashboard";

import Auth from "./Auth";

import { BrowserRouter as Router, Route, Routes, useLocation } from 'react-router-dom';

const PAGES = {
    
    Home: Home,
    
    GetStarted: GetStarted,
    
    CustomerDashboard: CustomerDashboard,
    
    VendorDashboard: VendorDashboard,
    
    Auth: Auth,
    
}

function _getCurrentPage(url) {
    if (url.endsWith('/')) {
        url = url.slice(0, -1);
    }
    let urlLastPart = url.split('/').pop();
    if (urlLastPart.includes('?')) {
        urlLastPart = urlLastPart.split('?')[0];
    }

    const pageName = Object.keys(PAGES).find(page => page.toLowerCase() === urlLastPart.toLowerCase());
    return pageName || Object.keys(PAGES)[0];
}

// Create a wrapper component that uses useLocation inside the Router context
function PagesContent() {
    const location = useLocation();
    const currentPage = _getCurrentPage(location.pathname);
    
    return (
        <Layout currentPageName={currentPage}>
            <Routes>            
                
                    <Route path="/" element={<Home />} />
                
                
                <Route path="/Home" element={<Home />} />
                
                <Route path="/GetStarted" element={<GetStarted />} />
                
                <Route path="/CustomerDashboard" element={<CustomerDashboard />} />
                
                <Route path="/VendorDashboard" element={<VendorDashboard />} />
                
                <Route path="/Auth" element={<Auth />} />
                
            </Routes>
        </Layout>
    );
}

export default function Pages() {
    return (
        <Router>
            <PagesContent />
        </Router>
    );
}