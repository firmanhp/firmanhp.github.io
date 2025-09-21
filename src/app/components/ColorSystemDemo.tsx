import React from 'react';

export default function ColorSystemDemo() {
  return (
    <div className="space-y-8 p-6 bg-background text-foreground">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-ctp-mauve">
          Color System Demo
        </h1>
        <p className="text-muted">
          Demonstrating CSS custom properties with Tailwind CSS integration
        </p>
      </div>

      {/* Brand Colors Section */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold text-ctp-rosewater">Brand Colors</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-primary text-primary-foreground rounded-lg">
            <h3 className="font-medium">Primary</h3>
            <p className="text-sm opacity-90">Main brand color (Blue)</p>
            <code className="text-xs">bg-primary</code>
          </div>
          <div className="p-4 bg-secondary text-secondary-foreground rounded-lg">
            <h3 className="font-medium">Secondary</h3>
            <p className="text-sm opacity-90">Supporting color</p>
            <code className="text-xs">bg-secondary</code>
          </div>
          <div className="p-4 bg-accent text-accent-foreground rounded-lg">
            <h3 className="font-medium">Accent</h3>
            <p className="text-sm opacity-90">Highlight color (Mauve)</p>
            <code className="text-xs">bg-accent</code>
          </div>
        </div>
      </section>

      {/* Status Colors Section */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold text-ctp-rosewater">Status Colors</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-3 bg-success/20 border border-success rounded-lg">
            <div className="w-4 h-4 bg-success rounded-full mb-2"></div>
            <h4 className="font-medium text-success">Success</h4>
            <code className="text-xs text-muted">bg-success</code>
          </div>
          <div className="p-3 bg-ctp-yellow/20 border border-warning rounded-lg">
            <div className="w-4 h-4 bg-warning rounded-full mb-2"></div>
            <h4 className="font-medium text-warning">Warning</h4>
            <code className="text-xs text-muted">bg-warning</code>
          </div>
          <div className="p-3 bg-error/20 border border-error rounded-lg">
            <div className="w-4 h-4 bg-error rounded-full mb-2"></div>
            <h4 className="font-medium text-error">Error</h4>
            <code className="text-xs text-muted">bg-error</code>
          </div>
          <div className="p-3 bg-info/20 border border-info rounded-lg">
            <div className="w-4 h-4 bg-info rounded-full mb-2"></div>
            <h4 className="font-medium text-info">Info</h4>
            <code className="text-xs text-muted">bg-info</code>
          </div>
        </div>
      </section>

      {/* Alpha/Opacity Examples */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold text-ctp-rosewater">Alpha/Opacity Support</h2>
        <div className="space-y-2">
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 bg-primary rounded-lg">100</div>
            <div className="w-16 h-16 bg-primary/80 rounded-lg">80</div>
            <div className="w-16 h-16 bg-primary/60 rounded-lg">60</div>
            <div className="w-16 h-16 bg-primary/40 rounded-lg">40</div>
            <div className="w-16 h-16 bg-primary/20 rounded-lg">20</div>
            <div className="text-sm text-muted">
              <code>bg-primary</code> → <code>bg-primary/20</code>
            </div>
          </div>
        </div>
      </section>

      {/* Catppuccin Palette */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold text-ctp-rosewater">Full Catppuccin Palette</h2>
        <div className="grid grid-cols-4 md:grid-cols-8 gap-2">
          {[
            { name: 'rosewater', class: 'bg-ctp-rosewater' },
            { name: 'flamingo', class: 'bg-ctp-flamingo' },
            { name: 'pink', class: 'bg-ctp-pink' },
            { name: 'mauve', class: 'bg-ctp-mauve' },
            { name: 'red', class: 'bg-ctp-red' },
            { name: 'maroon', class: 'bg-ctp-maroon' },
            { name: 'peach', class: 'bg-ctp-peach' },
            { name: 'yellow', class: 'bg-ctp-yellow' },
            { name: 'green', class: 'bg-ctp-green' },
            { name: 'teal', class: 'bg-ctp-teal' },
            { name: 'sky', class: 'bg-ctp-sky' },
            { name: 'sapphire', class: 'bg-ctp-sapphire' },
            { name: 'blue', class: 'bg-ctp-blue' },
            { name: 'lavender', class: 'bg-ctp-lavender' },
          ].map((color) => (
            <div key={color.name} className="space-y-1">
              <div className={`w-full h-12 ${color.class} rounded border border-border`}></div>
              <p className="text-xs text-muted text-center capitalize">
                {color.name}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Usage Examples */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold text-ctp-rosewater">Usage Examples</h2>
        <div className="space-y-4">
          {/* Button Examples */}
          <div className="space-y-2">
            <h3 className="text-lg font-medium">Buttons</h3>
            <div className="flex flex-wrap gap-2">
              <button className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors">
                Primary Button
              </button>
              <button className="px-4 py-2 bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/90 transition-colors">
                Secondary Button
              </button>
              <button className="px-4 py-2 bg-accent text-accent-foreground rounded-lg hover:bg-accent/90 transition-colors">
                Accent Button
              </button>
              <button className="px-4 py-2 border border-border text-foreground rounded-lg hover:bg-muted transition-colors">
                Outline Button
              </button>
            </div>
          </div>

          {/* Card Example */}
          <div className="space-y-2">
            <h3 className="text-lg font-medium">Card</h3>
            <div className="p-6 bg-secondary border border-border rounded-lg">
              <h4 className="text-lg font-semibold mb-2">Card Title</h4>
              <p className="text-muted mb-4">
                This card uses semantic colors that adapt to any theme overlay.
              </p>
              <div className="flex justify-between items-center">
                <span className="text-success">✓ Success state</span>
                <button className="px-3 py-1 bg-primary text-primary-foreground rounded text-sm">
                  Action
                </button>
              </div>
            </div>
          </div>

          {/* Alert Examples */}
          <div className="space-y-2">
            <h3 className="text-lg font-medium">Alerts</h3>
            <div className="space-y-2">
              <div className="p-3 bg-success/10 border border-success text-success rounded-lg">
                <strong>Success:</strong> Operation completed successfully!
              </div>
              <div className="p-3 bg-warning/10 border border-warning text-warning rounded-lg">
                <strong>Warning:</strong> Please review your input.
              </div>
              <div className="p-3 bg-error/10 border border-error text-error rounded-lg">
                <strong>Error:</strong> Something went wrong.
              </div>
              <div className="p-3 bg-info/10 border border-info text-info rounded-lg">
                <strong>Info:</strong> Here&apos;s some helpful information.
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}