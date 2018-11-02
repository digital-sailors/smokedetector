# smokedetector

A simple smoke test utility for websites.

# Philosophy

Smokedetector is intended to automate the most basic checks for a website. (In QA terms: It runs a smoke test.) 

Smokedetector can be used to automatically check if:

- Your homepage works
- Your robots.txt and sitemap.xml are accessible
- Your landing pages are available
- Your redirect from http:// to https:// works
- any important URL is working

Preliminary configuration is kept to an absolute minimum. You have to provide
- your hostname (e.g. www.google.com)
- the URLs you want smoketest to check (e.g. "/", "/robots.txt", "/very/important/landingpage.html")

# Usage

To start using smokedetector in a project, run:

```
npx smokedetector --init
```

Optional: add more URLs to the file `smokedetector.json`.

Whenever you want to make sure that your site is working, run:

```
npx smokedetector
```

The first time this is run, smokedetector assumes a known-good system, i.e. the responses of the system are recorded and subsequent runs of smokedetector expect the same responses to occur.

# What does it do?

smokedetector reads host and path information from the file `smokedetector.json`.
It constructs URLs and makes a request. If smokedetector has not visited the URL, the HTTP status code and (in case of redirects) the "Location"-Header is recorded. From now on, every run of smokedetector expects the same response code and "Location"-header (if applicable). If the response codes do not match the expectation, smokedetector tells you.

# The smokedetector.json file

This is an example of the configuration file:

```
{
  "description": "This configuration is used by smokedetector. smokedetector allows you to quickly check that the most important urls on a website work. Learn more at https://github.com/digital-sailors/smokedetector",
  "servers": {
    "live": {
      "host": "www.digital-sailors.de"
    }
  },
  "urlspace": {
    "http": {
      "/": {},
      "/your/other/http/urls/here.html": {}
    },
    "https": {
      "/": {},
      "/your/other/https/urls/here.html": {}
    }
  }
}
```

It is created when you run `npx smokedetector --init`. You can add any number of URLs, ones that should work with https:// and ones that work with http://

When you run smokedetector, it records the responses in this file. The file is considered diff-aware, i.e. changes happen when something significant changed. If you find this file modified without reason, that probably means that a smoke test gave a different result than the one that was expected.

## Multiple Hosts

TBA

## HTTP downgrade

TBA

# Advanced use cases

## Compare a staging system and the live system

### Handle non-HTTPS systems


# License

Licensed under

Apache License, Version 2.0, (LICENSE-APACHE or http://www.apache.org/licenses/LICENSE-2.0)

# Contribution Licensing

Unless you explicitly state otherwise, any contribution intentionally submitted for inclusion in the work by you, as defined in the Apache-2.0 license, shall be licensed as above, without any additional terms or conditions.