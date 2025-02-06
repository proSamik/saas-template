'use client'

export function Testimonials() {
  const testimonials = [
    {
      content: 'This platform has completely transformed how we handle our development workflow. The features are exactly what we needed.',
      author: 'Sarah Chen',
      role: 'CTO at TechStart',
    },
    {
      content: 'The authentication system is rock-solid, and the developer experience is outstanding. Highly recommended!',
      author: 'Michael Rodriguez',
      role: 'Lead Developer at DevCorp',
    },
    {
      content: 'We migrated our entire infrastructure to this platform, and it was the best decision we made this year.',
      author: 'Emily Thompson',
      role: 'Engineering Manager at ScaleUp',
    },
  ]

  return (
    <div className="bg-light-background dark:bg-dark-background py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-xl text-center">
          <h2 className="text-lg font-semibold leading-8 text-primary-600">Testimonials</h2>
          <p className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
            Trusted by developers worldwide
          </p>
        </div>
        <div className="mx-auto mt-16 flow-root max-w-2xl sm:mt-20 lg:mx-0 lg:max-w-none">
          <div className="-mt-8 sm:-mx-4 sm:columns-2 sm:text-[0] lg:columns-3">
            {testimonials.map((testimonial) => (
              <div key={testimonial.author} className="pt-8 sm:inline-block sm:w-full sm:px-4">
                <figure className="rounded-2xl bg-light-accent dark:bg-dark-accent p-8 text-sm leading-6">
                  <blockquote className="text-light-foreground dark:text-dark-foreground">
                    <p>"{testimonial.content}"</p>
                  </blockquote>
                  <figcaption className="mt-6 flex items-center gap-x-4">
                    <div>
                      <div className="font-semibold text-light-foreground dark:text-dark-foreground">
                        {testimonial.author}
                      </div>
                      <div className="text-light-muted dark:text-dark-muted">{testimonial.role}</div>
                    </div>
                  </figcaption>
                </figure>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}