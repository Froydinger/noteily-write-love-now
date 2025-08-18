
import type { Config } from "tailwindcss";

export default {
	darkMode: ["class"],
	content: [
		"./pages/**/*.{ts,tsx}",
		"./components/**/*.{ts,tsx}",
		"./app/**/*.{ts,tsx}",
		"./src/**/*.{ts,tsx}",
	],
	prefix: "",
	theme: {
		container: {
			center: true,
			padding: '2rem',
			screens: {
				'2xl': '1400px'
			}
		},
		extend: {
			fontFamily: {
				'serif': ['Playfair Display', 'Georgia', 'serif'],
				'sans': ['Inter', 'system-ui', 'sans-serif'],
				'opensans': ['Open Sans', 'system-ui', 'sans-serif'],
			},
			colors: {
				border: 'hsl(var(--border))',
				input: 'hsl(var(--input))',
				ring: 'hsl(var(--ring))',
				background: 'hsl(var(--background))',
				foreground: 'hsl(var(--foreground))',
				primary: {
					DEFAULT: 'hsl(var(--primary))',
					foreground: 'hsl(var(--primary-foreground))'
				},
				secondary: {
					DEFAULT: 'hsl(var(--secondary))',
					foreground: 'hsl(var(--secondary-foreground))'
				},
				destructive: {
					DEFAULT: 'hsl(var(--destructive))',
					foreground: 'hsl(var(--destructive-foreground))'
				},
				muted: {
					DEFAULT: 'hsl(var(--muted))',
					foreground: 'hsl(var(--muted-foreground))'
				},
				accent: {
					DEFAULT: 'hsl(var(--accent))',
					foreground: 'hsl(var(--accent-foreground))'
				},
				popover: {
					DEFAULT: 'hsl(var(--popover))',
					foreground: 'hsl(var(--popover-foreground))'
				},
				card: {
					DEFAULT: 'hsl(var(--card))',
					foreground: 'hsl(var(--card-foreground))'
				},
				noteily: {
					50: '#f8f8f8',
					100: '#f0f0f0',
					200: '#e4e4e4',
					300: '#d1d1d1',
					400: '#b4b4b4',
					500: '#9a9a9a',
					600: '#818181',
					700: '#6a6a6a',
					800: '#5a5a5a',
					900: '#4e4e4e',
					950: '#282828',
				},
				neon: {
					blue: '#1EAEDB',
					lighter: '#33C3F0',
					darker: '#0FA0CE',
				},
				sidebar: {
					DEFAULT: 'hsl(var(--sidebar-background))',
					foreground: 'hsl(var(--sidebar-foreground))',
					primary: 'hsl(var(--sidebar-primary))',
					'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
					accent: 'hsl(var(--sidebar-accent))',
					'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
					border: 'hsl(var(--sidebar-border))',
					ring: 'hsl(var(--sidebar-ring))'
				}
			},
			borderRadius: {
				lg: 'var(--radius)',
				md: 'calc(var(--radius) - 2px)',
				sm: 'calc(var(--radius) - 4px)'
			},
			boxShadow: {
				'neon-blue': '0 0 5px #1EAEDB, 0 0 10px #1EAEDB',
				'neon-blue-sm': '0 0 3px #1EAEDB',
			},
			keyframes: {
				'accordion-down': {
					from: {
						height: '0',
						opacity: '0'
					},
					to: {
						height: 'var(--radix-accordion-content-height)',
						opacity: '1'
					}
				},
				'accordion-up': {
					from: {
						height: 'var(--radix-accordion-content-height)',
						opacity: '1'
					},
					to: {
						height: '0',
						opacity: '0'
					}
				},
				'fade-in': {
					'0%': { 
						opacity: '0',
						transform: 'translateY(10px)'
					},
					'100%': { 
						opacity: '1',
						transform: 'translateY(0)'
					}
				},
				'fade-out': {
					'0%': { 
						opacity: '1',
						transform: 'translateY(0)'
					},
					'100%': { 
						opacity: '0',
						transform: 'translateY(10px)'
					}
				},
				'float-in': {
					'0%': {
						opacity: '0',
						transform: 'translateY(20px) scale(0.95)'
					},
					'60%': {
						opacity: '0.9',
						transform: 'translateY(-2px) scale(1.01)'
					},
					'100%': {
						opacity: '1',
						transform: 'translateY(0) scale(1)'
					}
				},
				'scale-in': {
					'0%': {
						opacity: '0',
						transform: 'scale(0.9)'
					},
					'50%': {
						opacity: '0.8',
						transform: 'scale(1.02)'
					},
					'100%': {
						opacity: '1',
						transform: 'scale(1)'
					}
				},
				'gentle-bounce': {
					'0%, 100%': {
						transform: 'translateY(0)'
					},
					'50%': {
						transform: 'translateY(-2px)'
					}
				},
				'slide-up-smooth': {
					'0%': {
						opacity: '0',
						transform: 'translateY(30px)'
					},
					'100%': {
						opacity: '1',
						transform: 'translateY(0)'
					}
				},
				'shake': {
					'0%, 100%': { transform: 'translateX(0)' },
					'10%, 30%, 50%, 70%, 90%': { transform: 'translateX(-3px)' },
					'20%, 40%, 60%, 80%': { transform: 'translateX(3px)' }
				},
				'wiggle': {
					'0%, 100%': { transform: 'rotate(0deg)' },
					'25%': { transform: 'rotate(1deg)' },
					'75%': { transform: 'rotate(-1deg)' }
				}
			},
			animation: {
				'accordion-down': 'accordion-down 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
				'accordion-up': 'accordion-up 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
				'fade-in': 'fade-in 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
				'fade-out': 'fade-out 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
				'float-in': 'float-in 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
				'scale-in': 'scale-in 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
				'gentle-bounce': 'gentle-bounce 2s ease-in-out infinite',
				'slide-up-smooth': 'slide-up-smooth 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
				'shake': 'shake 0.6s ease-in-out',
				'wiggle': 'wiggle 0.8s ease-in-out infinite'
			}
		}
	},
	plugins: [require("tailwindcss-animate")],
} satisfies Config;
