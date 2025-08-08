import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import HomePage from "./HomePage";
import MyCalendarPage from "./MyCalendarPage";
import PersonalCalendarPage from "./PersonalCalendarPage";
import "./App.css";
import NewGroupPage from "./NewGroupPage";
import LoginForm from "./LoginForm";
import RegisterForm from "./RegisterForm";
import ProtectedRoute from "./components/ProtectedRoute";
import AuthRedirect from "./components/AuthRedirect";
import Layout from "./components/Layout";
import { AppProvider } from "./contexts/AppContext";

function App() {
  return (
    <AppProvider>
      <Router>
        <Routes>
        <Route 
          path="/" 
          element={
            <AuthRedirect>
              <HomePage />
            </AuthRedirect>
          } 
        />
        <Route 
          path="/login" 
          element={
            <AuthRedirect>
              <LoginForm />
            </AuthRedirect>
          } 
        />
        <Route 
          path="/register" 
          element={
            <AuthRedirect>
              <RegisterForm />
            </AuthRedirect>
          } 
        />
        <Route 
          path="/calendar" 
          element={
            <ProtectedRoute>
              <Layout>
                <MyCalendarPage />
              </Layout>
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/schedule" 
          element={
            <ProtectedRoute>
              <Layout>
                <PersonalCalendarPage />
              </Layout>
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/new-group" 
          element={
            <ProtectedRoute>
              <Layout>
                <NewGroupPage />
              </Layout>
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/personal-calendar" 
          element={
            <ProtectedRoute>
              <Layout>
                <PersonalCalendarPage />
              </Layout>
            </ProtectedRoute>
          } 
        />
        </Routes>
      </Router>
    </AppProvider>
  );
}

export default App;