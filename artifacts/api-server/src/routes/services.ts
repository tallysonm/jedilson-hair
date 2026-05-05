import { Router } from "express";

const router = Router();

export const SERVICES = [
  { id: "corte-simples", name: "Corte de cabelo simples", price: 35, priceLabel: "R$ 35,00", durationMinutes: 30, durationLabel: "30min" },
  { id: "corte-sobrancelha", name: "Corte de cabelo simples + sobrancelha", price: 45, priceLabel: "R$ 45,00", durationMinutes: 30, durationLabel: "30min" },
  { id: "corte-barba", name: "Corte de cabelo + barba", price: 60, priceLabel: "R$ 60,00", durationMinutes: 50, durationLabel: "50min" },
  { id: "corte-penteado-barba-sobrancelha", name: "Corte + penteado + barba + sobrancelha", price: 80, priceLabel: "R$ 80,00", durationMinutes: 60, durationLabel: "1h" },
  { id: "corte-progressiva", name: "Corte de cabelo + progressiva", price: 90, priceLabel: "R$ 90,00", durationMinutes: 90, durationLabel: "1h30min" },
  { id: "dois-cortes", name: "2 cortes de cabelo simples", price: 70, priceLabel: "R$ 70,00", durationMinutes: 60, durationLabel: "1h" },
  { id: "pezinho", name: "Pezinho do cabelo", price: 10, priceLabel: "R$ 10,00", durationMinutes: 5, durationLabel: "5min" },
  { id: "penteado", name: "Penteado", price: 25, priceLabel: "R$ 25,00", durationMinutes: 20, durationLabel: "20min" },
  { id: "corte-luzes", name: "Corte + luzes", price: 110, priceLabel: "R$ 110,00", durationMinutes: 45, durationLabel: "45min" },
  { id: "corte-luzes-branca", name: "Corte + luzes branca", price: 150, priceLabel: "R$ 150,00", durationMinutes: 45, durationLabel: "45min" },
  { id: "sobrancelha", name: "Sobrancelha", price: 10, priceLabel: "R$ 10,00", durationMinutes: 5, durationLabel: "5min" },
  { id: "barba", name: "Barba", price: 25, priceLabel: "R$ 25,00", durationMinutes: 20, durationLabel: "20min" },
  { id: "corte-relaxamento", name: "Corte de cabelo + relaxamento", price: 60, priceLabel: "R$ 60,00+", durationMinutes: 40, durationLabel: "40min" },
  { id: "corte-penteado", name: "Corte de cabelo + penteado", price: 45, priceLabel: "R$ 45,00", durationMinutes: 50, durationLabel: "50min" },
  { id: "corte-dimil-colorido", name: "Corte de cabelo dimil colorido", price: 50, priceLabel: "R$ 50,00", durationMinutes: 50, durationLabel: "50min" },
];

router.get("/", (_req, res) => {
  res.json(SERVICES);
});

export default router;
