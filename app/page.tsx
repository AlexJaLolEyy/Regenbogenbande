"use client"

import { Camera, MessageCircle, Tag } from "lucide-react";
import { motion } from "motion/react"

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white p-6">
      <motion.section
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7 }}
        className="flex flex-col md:flex-row items-center gap-8 mb-12"
      >
        <img
          src="/exampleUserPictures/exampleAlex.jpg"
          alt="Gamer"
          className="w-full md:w-1/2 rounded-2xl shadow-lg object-cover max-h-80"
        />
        <div className="flex-1 text-center md:text-left">
          <h1 className="text-4xl md:text-5xl font-extrabold mb-4 leading-tight">
            Erlebe die besten Momente – <br className="hidden md:block" />
            <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              Highlight Clips aus unserer Crew.
            </span>
          </h1>
          <div className="flex flex-col sm:flex-row gap-4 justify-center md:justify-start mb-4">
            <motion.button
              whileHover={{ scale: 1.05 }}
              className="bg-purple-600 hover:bg-purple-700 px-6 py-2 rounded-full font-semibold shadow transition"
            >
              Clips anschauen
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              className="bg-white/10 hover:bg-white/20 px-6 py-2 rounded-full font-semibold shadow transition backdrop-blur"
            >
              Login
            </motion.button>
          </div>
        </div>
      </motion.section>

      {/* Features (Glassmorphism Cards) */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        {[{
          icon: <Camera className="w-8 h-8 mb-2 text-purple-400" />,
          title: "Screenshots",
          desc: "direkt aus Videos"
        }, {
          icon: <MessageCircle className="w-8 h-8 mb-2 text-pink-400" />,
          title: "Zitate & Kommentare",
          desc: "unter Clips"
        }, {
          icon: <Tag className="w-8 h-8 mb-2 text-blue-400" />,
          title: "Smartes Tagging",
          desc: "Suche nach Momenten"
        }].map((feature, i) => (
          <motion.div
            key={feature.title}
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 + i * 0.1 }}
            whileHover={{ scale: 1.03, boxShadow: "0 8px 32px 0 rgba(31, 38, 135, 0.37)" }}
            className="bg-white/10 backdrop-blur-md rounded-xl p-6 flex flex-col items-center shadow-lg cursor-pointer"
          >
            {feature.icon}
            <span className="font-bold text-lg">{feature.title}</span>
            <span className="text-sm text-gray-300">{feature.desc}</span>
          </motion.div>
        ))}
      </section>

      {/* Bento-style Highlight Clips */}
      {/* TODO: Add actual clips and connect thumbnails to clips */}
      <motion.section
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, delay: 0.5 }}
      >
        <h2 className="text-2xl font-bold mb-4">Highlight-Clips</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {["exampleThumbnail1.png", "exampleThumbnail2.png", "exampleThumbnail3.png"].map((img, i) => (
            <motion.img
              key={img}
              src={`/exampleThumbnails/${img}`}
              className="rounded-xl object-cover h-40 w-full"
              whileHover={{ scale: 1.03 }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.6 + i * 0.1 }}
            />
          ))}
        </div>
      </motion.section>

      {/* Footer */}
      <footer className="flex flex-col md:flex-row justify-between items-center mt-12 text-gray-400 text-sm gap-2">
        <span>Über uns</span>
        <span>GitHub</span>
        <span>Impressum</span>
      </footer>
    </main>
  );
}