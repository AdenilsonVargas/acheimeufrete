import { MapPin, Phone, Mail, Facebook, Twitter, Linkedin, Instagram } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useTheme } from '@/contexts/ThemeContext';

export default function Footer() {
  const { isDark } = useTheme();

  return (
    <footer className="bg-white dark:bg-slate-950 border-t border-gray-300 dark:border-slate-700 mt-20">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Sobre - Com Logo */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <img 
                src="/images/logoatualizada.png" 
                alt="ACHEI MEU FRETE" 
                className="h-10 w-auto object-contain"
              />
              <img 
                src={isDark 
                  ? "/images/acheimeufretefontebranca.png" 
                  : "/images/acheimeufretefontepreta.png"
                }
                alt="ACHEI MEU FRETE" 
                className="h-6 w-auto object-contain"
              />
            </div>
            <p className="text-gray-800 dark:text-slate-400 text-sm mb-4">
              Conectando embarcadores e transportadores em uma plataforma moderna e segura de logística.
            </p>
            <div className="flex gap-4">
              <a href="#" className="text-gray-800 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition">
                <Facebook className="w-5 h-5" />
              </a>
              <a href="#" className="text-gray-800 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition">
                <Twitter className="w-5 h-5" />
              </a>
              <a href="#" className="text-gray-800 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition">
                <Linkedin className="w-5 h-5" />
              </a>
              <a href="#" className="text-gray-800 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition">
                <Instagram className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Links Rápidos */}
          <div>
            <h4 className="text-black dark:text-white font-semibold mb-4">Links Rápidos</h4>
            <ul className="space-y-2">
              <li>
                <Link to="/" className="text-gray-800 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition">
                  Home
                </Link>
              </li>
              <li>
                <Link to="/sobre" className="text-gray-800 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition">
                  Sobre Nós
                </Link>
              </li>
              <li>
                <Link to="/faq" className="text-gray-800 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition">
                  FAQ
                </Link>
              </li>
              <li>
                <Link to="/contato" className="text-gray-800 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition">
                  Contato
                </Link>
              </li>
            </ul>
          </div>

          {/* Para Embarcadores */}
          <div>
            <h4 className="text-black dark:text-white font-semibold mb-4">Embarcadores</h4>
            <ul className="space-y-2">
              <li>
                <Link to="/cadastro" className="text-gray-800 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition">
                  Cadastre-se
                </Link>
              </li>
              <li>
                <Link to="/login" className="text-gray-800 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition">
                  Fazer Login
                </Link>
              </li>
              <li>
                <a href="#" className="text-gray-800 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition">
                  Planos Premium
                </a>
              </li>
            </ul>
          </div>

          {/* Contato */}
          <div>
            <h4 className="text-black dark:text-white font-semibold mb-4">Contato</h4>
            <ul className="space-y-3">
              <li className="flex items-start gap-2">
                <Phone className="w-5 h-5 text-black dark:text-blue-400 mt-0.5 flex-shrink-0" />
                <span className="text-gray-800 dark:text-slate-400 text-sm">+55 (XX) XXXXX-XXXX</span>
              </li>
              <li className="flex items-start gap-2">
                <Mail className="w-5 h-5 text-black dark:text-blue-400 mt-0.5 flex-shrink-0" />
                 <span className="text-gray-800 dark:text-slate-400 text-sm">contato@acheimeufrete.com.br</span>
              </li>
              <li className="flex items-start gap-2">
                <MapPin className="w-5 h-5 text-black dark:text-blue-400 mt-0.5 flex-shrink-0" />
                <span className="text-gray-800 dark:text-slate-400 text-sm">Brasil</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom */}
        <div className="border-t border-gray-300 dark:border-slate-700 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-gray-800 dark:text-slate-400 text-sm">
              © 2024 ACHEI MEU FRETE. Todos os direitos reservados.
            </p>
            <div className="flex gap-6 mt-4 md:mt-0">
              <a href="#" className="text-gray-800 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition text-sm">
                Termos de Serviço
              </a>
              <a href="#" className="text-gray-800 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition text-sm">
                Política de Privacidade
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
