import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import HomePage from "./HomePage";
import MyCalendarPage from "./MyCalendarPage";
import MyScheduleView from "./MyScheduleView";
import "./App.css";
import NewGroupPage from "./NewGroupPage";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/calendar" element={<MyCalendarPage />} />
        <Route path="/schedule" element={<MyScheduleView />} />
        <Route path="/new-group" element={<NewGroupPage />} />
      </Routes>
    </Router>
  );
}

export default App;