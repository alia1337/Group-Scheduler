import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import HomePage from "./HomePage";
import MyCalendarPage from "./MyCalendarPage";
import MyScheduleView from "./MyScheduleView";
import "./App.css";
import NewGroupPage from "./NewGroupPage";
import LoginForm from "./LoginForm";
import RegisterForm from "./RegisterForm";
import ProtectedRoute from "./components/ProtectedRoute";
import AuthRedirect from "./components/AuthRedirect";

function App() {
  return (
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
              <MyCalendarPage />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/schedule" 
          element={
            <ProtectedRoute>
              <MyScheduleView />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/new-group" 
          element={
            <ProtectedRoute>
              <NewGroupPage />
            </ProtectedRoute>
          } 
        />
      </Routes>
    </Router>
  );
}

export default App;