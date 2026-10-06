# Content pack — CPET 181 Chapter 9: Network organization concepts and security (#527)

Source: Ch9 deck (pptx, 25 slides; Tier-1, not in the repo). References are slides (`Ch9 s.N`).
Restated, never quoted. No computed content. Taught week 16 (`weeks.md`); the syllabus also lists
Windows power-user techniques, Windows networking and TCP/IP commands for that week, which are lab
material outside this deck. Not assessed in the quiz documents of the source base.

## Deck-wide conventions
| Item | As taught |
|---|---|
| OS kinds | NOS (network OS) and D/OS (distributed OS) |
| Comparison tables | LAN/MAN/WAN (s.14), circuit vs packet switching (s.22) |
| Context slides | s.1 title; s.17 wireless LAN drawing (laptops, access points, wired LAN); s.21 packet figure; s.23 section title |

## 1. Basic terms — s.2–4 — CORE
| Term | Meaning |
|---|---|
| Network | Loosely coupled processors linked by cable, wireless or both |
| Goal | Share hardware and software while controlling user access |
| Local / remote | Each processor calls its own resources local, others remote |
| Site | A location with one or more computers |
| Host | A computer at a site whose services others use remotely |
| Node | The name that identifies a computer to the others |
| Client / server (s.4) | Clients request data or services from the server host and wait for the reply |

## 2. Topologies — s.5–12 — CORE
Trade-offs (s.6): communication cost (message time), reliability (still connected after a failure),
basic cost of links, difficulty of connecting many sites.

| Topology | Shape | Plus | Minus / note |
|---|---|---|---|
| Star (s.7) | All traffic through a central controller | Easy routing and access control | Centre must be extremely reliable and carry all traffic |
| Ring (s.8–9) | Closed loop, packets pass one way node to node; double loop variant | Joins other networks by bridge (same protocol) or gateway (different) | Every node must work or be bypassed |
| Bus (s.10) | All sites on one line; messages travel both ways | Direct device-to-device delivery or to an end-point controller | One sender at a time; needs collision control |
| Tree (s.11) | Busses joined by branching cable, no loops | Traffic still flows if one node fails | End-point controller absorbs unaccepted messages |
| Hybrid (s.12) | Mix of the above | Picks each topology's strengths | — |

## 3. Network types — s.13–14 — CORE
| | LAN | MAN | WAN |
|---|---|---|---|
| Area | Building or campus | Blocks to a city (up to about 100 km) | Country or world |
| Ownership | One organization | One operator, many users | Common carriers' lines |
| Speed | 100 Mbps to over 40 Gbps | High | Usually slower than LAN |
| Topology | Star, ring, bus, tree, hybrid | Usually a logical ring | Various |
| Example | Office network | City Wi-Fi, cable TV | Internet |

Bridge vs gateway (s.15): bridge joins LANs with the **same** protocol; gateway joins networks with
**different** protocols by translating.

## 4. Wireless LAN — s.16–17 — CORE
| Standard | Speed | Range indoors | Frequency |
|---|---|---|---|
| 802.11a | 54 Mbps | 25–75 ft | 5 GHz |
| 802.11b | 11 Mbps | 100–150 ft | 2.4 GHz |
| 802.11g | 54 Mbps | 100–150 ft | 2.4 GHz |

WiMax (802.16): wireless broadband over up to about 10 miles. Compatibility column — see owner note.

## 5. Switching — s.18–22 — CORE
| | Circuit switching (s.19) | Packet switching (s.20) |
|---|---|---|
| How | Dedicated path set up before sending (telephone) | Store and forward; message cut into equal packets, reassembled at the destination |
| Timing | Real time; set-up delay first | In batches |
| Volume | Low-volume networks | High-volume networks |
| Line efficiency | Reduced; line dedicated to one transmission | High; line shared |
| Voice | Preferred | Not good |
| Other | Easily overloaded | Flexible, reliable, supports message priorities |

## 6. Security and ethics — s.23–25 — CORE
Protection methods (s.24): antivirus (preventive and diagnostic, kept up to date); firewalls (logging,
access control, hiding the internal network, virus checks, authentication); encryption of sensitive
traffic; password management (complex, memorable, changed often). Ethics (s.25): do good; IEEE and ACM
standards; respect privacy and proprietary information; issues: piracy, plagiarism, eavesdropping,
cracking/hacking, unauthorized access.

## Ambiguities
| Where | Note |
|---|---|
| s.16 | 802.11b/g compatibility cells — see owner note |
| Syllabus week 16 | TCP/IP commands and Windows networking are not in the deck |
