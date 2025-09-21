import Link from "next/link";

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer style={{borderTop: '1px solid #45475a', backgroundColor: '#11111b'}} className="mt-32">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Brand/Info */}
          <div className="col-span-2">
            <p className="text-sm" style={{color: '#a6adc8'}}>
              Congratulations, you have reached the bottom!
            </p>
          </div>


          {/* Social/Contact */}
          <div>
            <h3 className="text-lg font-semibold mb-4" style={{color: '#cdd6f4'}}>
              Connect
            </h3>
            <div className="space-y-2">
              <Link 
                href="https://github.com/firmanhp" 
                className="block text-sm hover:text-blue-400 transition-colors"
                style={{color: '#a6adc8'}}
                target="_blank"
                rel="noopener noreferrer"
              >
                GitHub
              </Link>
            </div>
          </div>
        </div>

        {/* Copyright */}
        <div className="mt-8 pt-8" style={{borderTop: '1px solid #313244'}}>
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-xs" style={{color: '#6c7086'}}>
              © {currentYear} firmanhp. Built with Next.js and ❤️
            </p>
            <p className="text-xs mt-2 md:mt-0" style={{color: '#6c7086'}}>
              Theme uses Catppuccin color scheme.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}