import { useState } from 'react';
import { motion } from 'framer-motion';
import { Check, HelpCircle, ArrowRight, Sparkles, Shield, Zap } from 'lucide-react';

const Pricing = () => {
  const [billingCycle, setBillingCycle] = useState('monthly'); // 'monthly' | 'yearly'

  const plans = [
    {
      name: 'Starter',
      price: { monthly: 0, yearly: 0 },
      description: 'Ideal for individuals testing out local business lead generation.',
      features: [
        '5 queries / month',
        'Up to 50 business leads / search',
        'Basic Lead Scoring analytics',
        'Standard CSV export downloads',
        'Community forum support'
      ],
      cta: 'Start Free Trial',
      popular: false,
      icon: Shield,
      iconColor: 'text-slate-400 bg-slate-500/10 border-slate-500/20'
    },
    {
      name: 'Pro',
      price: { monthly: 49, yearly: 39 },
      description: 'Perfect for marketing agencies and dedicated B2B sales teams.',
      features: [
        'Unlimited monthly searches',
        'Up to 200 leads / search results',
        'Advanced Intelligent Lead Scoring',
        '100 Gemini AI Summary runs / month',
        'CSV & Excel sheet downloads',
        'Permanent Search History storage',
        'Priority email support'
      ],
      cta: 'Upgrade to Pro',
      popular: true,
      icon: Zap,
      iconColor: 'text-violet-400 bg-violet-500/10 border-violet-500/20'
    },
    {
      name: 'Enterprise',
      price: { monthly: 199, yearly: 159 },
      description: 'Tailored for scaling businesses requiring volume API and custom tools.',
      features: [
        'Everything in Pro plan',
        'Maximum lead crawling limits',
        'Unlimited Gemini AI Summary runs',
        'Custom Web Scraper integration',
        'API endpoint lead access',
        'Team collaboration workspaces',
        'Dedicated 24/7 Account Manager'
      ],
      cta: 'Contact Sales',
      popular: false,
      icon: Sparkles,
      iconColor: 'text-fuchsia-400 bg-fuchsia-500/10 border-fuchsia-500/20'
    }
  ];

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-16">
      {/* Title Header */}
      <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
        <span className="text-xs font-bold text-violet-600 dark:text-violet-400 uppercase tracking-widest bg-violet-100 dark:bg-violet-950/40 px-3 py-1.5 rounded-full">
          Simple Subscription Pricing
        </span>
        <h1 className="text-4xl sm:text-5xl font-extrabold text-slate-800 dark:text-white tracking-tight">
          Flexible Plans for Teams of Any Size
        </h1>
        <p className="text-sm sm:text-base text-slate-500 dark:text-slate-400 leading-relaxed">
          Scale your geographical sales pipeline instantly. Choose monthly flexibility or save 20% with our yearly billing cycle.
        </p>

        {/* Toggle Billing Cycle */}
        <div className="flex items-center justify-center pt-6">
          <div className="bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-1 rounded-xl flex items-center gap-1.5 relative">
            <button
              onClick={() => setBillingCycle('monthly')}
              className={`px-4 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                billingCycle === 'monthly'
                  ? 'bg-white dark:bg-slate-850 text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-850 dark:hover:text-slate-200'
              }`}
            >
              Billed Monthly
            </button>
            <button
              onClick={() => setBillingCycle('yearly')}
              className={`px-4 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                billingCycle === 'yearly'
                  ? 'bg-white dark:bg-slate-850 text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-850 dark:hover:text-slate-200'
              }`}
            >
              <span>Billed Annually</span>
              <span className="px-1.5 py-0.5 bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded text-[9px] font-extrabold uppercase">
                Save 20%
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch mb-20">
        {plans.map((plan, idx) => {
          const IconComp = plan.icon;
          const currentPrice = billingCycle === 'monthly' ? plan.price.monthly : plan.price.yearly;

          return (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: idx * 0.1 }}
              className={`flex flex-col justify-between bg-white dark:bg-slate-900 border rounded-3xl p-8 relative transition-all duration-300 ${
                plan.popular
                  ? 'border-violet-500 dark:border-violet-500 shadow-xl shadow-violet-500/5 ring-1 ring-violet-500/50'
                  : 'border-slate-200 dark:border-slate-800 hover:border-slate-350 dark:hover:border-slate-700'
              }`}
            >
              {/* Popular Badge */}
              {plan.popular && (
                <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-3 py-1 bg-gradient-to-r from-violet-600 to-indigo-600 rounded-full text-[10px] font-extrabold text-white uppercase tracking-wider shadow">
                  Most Popular
                </span>
              )}

              {/* Plan Info */}
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <span className="text-lg font-extrabold text-slate-800 dark:text-white">
                    {plan.name}
                  </span>
                  <div className={`p-2.5 rounded-xl border ${plan.iconColor}`}>
                    <IconComp className="w-5 h-5" />
                  </div>
                </div>

                <p className="text-xs text-slate-400 dark:text-slate-500 leading-relaxed">
                  {plan.description}
                </p>

                {/* Price Display */}
                <div className="flex items-baseline gap-1 text-slate-800 dark:text-white">
                  <span className="text-4xl font-extrabold tracking-tight">
                    ${currentPrice}
                  </span>
                  <span className="text-sm font-semibold text-slate-400 dark:text-slate-500">
                    / {billingCycle === 'monthly' ? 'month' : 'month, billed annually'}
                  </span>
                </div>

                <hr className="border-slate-100 dark:border-slate-800/80" />

                {/* Features List */}
                <div className="space-y-4">
                  <span className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                    What's Included:
                  </span>
                  <ul className="space-y-3.5">
                    {plan.features.map((feature, fIdx) => (
                      <li key={fIdx} className="flex items-start gap-2.5 text-xs text-slate-600 dark:text-slate-300">
                        <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* CTA Button */}
              <div className="pt-8">
                <button
                  className={`w-full py-3.5 px-4 rounded-xl text-xs font-bold transition duration-200 cursor-pointer flex items-center justify-center gap-1.5 ${
                    plan.popular
                      ? 'bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white shadow-lg shadow-violet-500/20'
                      : 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <span>{plan.cta}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* FAQs Snippet Section */}
      <div className="bg-slate-50 dark:bg-slate-900/30 border border-slate-100 dark:border-slate-900 rounded-3xl p-8 md:p-12 text-center max-w-4xl mx-auto space-y-6">
        <HelpCircle className="w-8 h-8 text-violet-500 dark:text-violet-400 mx-auto" />
        <h3 className="text-xl font-bold text-slate-855 dark:text-white">
          Have questions about our pricing tiers?
        </h3>
        <p className="text-xs sm:text-sm text-slate-400 dark:text-slate-500 max-w-xl mx-auto leading-relaxed">
          Our team can customize enterprise limits or integrate dedicated proxy setups. Standard users can test queries out on our free tier.
        </p>
        <button className="px-6 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 rounded-xl transition duration-200 cursor-pointer">
          Browse Full FAQ Page
        </button>
      </div>
    </div>
  );
};

export default Pricing;
