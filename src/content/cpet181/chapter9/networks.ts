/**
 * DEMO / NOT AUTHORITATIVE COURSE CONTENT — pending instructor approval.
 * CPET 181 Chapter 9, networks and security (#635; content pack ch9 §1–§6 and the #588 inventory
 * C9-1, C9-3 … C9-9): basic network terms, topologies (with the topology figure #626), network
 * types, bridge and gateway, the wireless LAN standards, circuit and packet switching, protection
 * methods and ethics. Multiple choice only; the chapter has no computed content, and every fact is
 * from docs/content-packs/cpet181/ch9.md. Not asked, because the pack does not give an attribute to
 * distinguish: NOS against D/OS (C9-2, named only), and the 802.11b/g compatibility and the DVD-style
 * open cells the pack marks "see owner note". No quiz key is used.
 */
import type { z } from "zod";
import type { TopicSchema } from "../../schema";
import { mcq, type Row } from "../chapter1/mcq";

type TopicInput = z.input<typeof TopicSchema>;
type Figure = NonNullable<Row["figure"]>;

const row = (prompt: string, correct: string, wrong: string[], rule: string, apply: string, hint: string, figure?: Figure): Row => ({ prompt, correct, wrong, rule, apply, hint, ...(figure ? { figure } : {}) });
const others = (all: string[], name: string) => all.filter((x) => x !== name);

/* ---------- basic terms ---------- */

const TERMS = "A network is loosely coupled processors linked by cable, wireless or both, to share hardware and software while controlling user access. A site is a location with one or more computers; a host is a computer at a site whose services others use remotely; a node is the name that identifies a computer to the others. A processor calls its own resources local and the others remote. A client requests data or services from the server host and waits for the reply.";
const TERM_NAMES = ["Site", "Host", "Node"];
const terms = mcq("nw.q.terms", "Site, host or node", "nw.terms", "nw.obj.terms", [
  row("A location with one or more computers is called a…", "Site", others(TERM_NAMES, "Site"), TERMS, "A location with computers is a site.", "It names a place, not a machine."),
  row("A computer at a site whose services other computers use remotely is called a…", "Host", others(TERM_NAMES, "Host"), TERMS, "A computer offering its services to others is a host.", "It serves the others."),
  row("The name that identifies a computer to the other computers is called a…", "Node", others(TERM_NAMES, "Node"), TERMS, "The identifying name of a computer is its node.", "It is a name, not a place or a service."),
]);

const SIDES = ["Local", "Remote"];
const localRemote = mcq("nw.q.client-server", "Local, remote, client", "nw.terms", "nw.obj.client-server", [
  row("A processor calls its own resources by which word?", "Local", others(SIDES, "Local"), TERMS, "A processor's own resources are local.", "Whose resources are they?"),
  row("A processor calls the resources of the other processors by which word?", "Remote", others(SIDES, "Remote"), TERMS, "The other processors' resources are remote.", "Whose resources are they?"),
  row("Which one requests data or services and then waits for the reply?", "The client", ["The server host", "The node"], TERMS, "A client requests and waits.", "It asks; it does not serve."),
  row("Which one provides the data or services that others request?", "The server host", ["The client", "The site"], TERMS, "The server host provides the services.", "It answers the requests."),
]);

/* ---------- topologies ---------- */

const TOPOLOGIES = "Star: all traffic through a central controller. Ring: a closed loop, packets passing one way from node to node. Bus: all sites on one line. Tree: busses joined by branching cable, with no loops. Hybrid: a mix of the others.";
const TOPOLOGY_NAMES = ["Star", "Ring", "Bus", "Tree", "Hybrid"];
const tn = (name: string, drop: string[] = []) => others(TOPOLOGY_NAMES, name).filter((x) => !drop.includes(x)).slice(0, 3);
const FIG = "A network drawn as sites and links.";
const shape = mcq("tp.q.shape", "Which topology is drawn", "tp.topologies", "tp.obj.shape", [
  row("The figure shows a network. Which topology is it?", "Star", tn("Star"), TOPOLOGIES, "Every site links only to the centre: a star.", "Is there one centre that every site joins?", { type: "topology", topology: "star", nodes: 6, caption: FIG }),
  row("The figure shows a network. Which topology is it?", "Ring", tn("Ring"), TOPOLOGIES, "The sites are joined in a closed loop: a ring.", "Follow the links from one site: where do you end up?", { type: "topology", topology: "ring", nodes: 6, caption: FIG }),
  row("The figure shows a network. Which topology is it?", "Bus", tn("Bus"), TOPOLOGIES, "All the sites hang off one shared line: a bus.", "Is there a single line that every site shares?", { type: "topology", topology: "bus", nodes: 6, caption: FIG }),
  row("The figure shows a network. Which topology is it?", "Tree", tn("Tree"), TOPOLOGIES, "Branches that never close a loop: a tree.", "Do any of the links make a loop?", { type: "topology", topology: "tree", nodes: 7, caption: FIG }),
]);

const traits = mcq("tp.q.traits", "Which topology", "tp.topologies", "tp.obj.traits", [
  row("All traffic goes through a central controller, which must be extremely reliable. Which topology is this?", "Star", tn("Star"), TOPOLOGIES, "A central controller carrying all traffic is a star.", "What happens if the centre fails?"),
  row("Packets pass one way from node to node round a closed loop, and every node must work or be bypassed. Which topology is this?", "Ring", tn("Ring"), TOPOLOGIES, "A one-way loop where every node must work is a ring.", "The packets go round."),
  row("All sites are on one line and only one can send at a time, so collisions must be controlled. Which topology is this?", "Bus", tn("Bus"), TOPOLOGIES, "One shared line, one sender at a time: a bus.", "How many lines are there?"),
  row("Busses are joined by branching cable with no loops, and traffic still flows if one node fails. Which topology is this?", "Tree", tn("Tree"), TOPOLOGIES, "Branching busses with no loops: a tree.", "There are no loops."),
]);

const FACTORS = "Topologies are compared on communication cost (message cost and time), reliability (still connected after a failure), the basic cost of the links, and the difficulty of connecting many sites.";
const FACTOR_NAMES = ["Communication cost", "Reliability", "Link cost", "Difficulty of connecting many sites"];
const factors = mcq("tp.q.factors", "Comparing topologies", "tp.topologies", "tp.obj.factors", [
  row("How long a message takes and what it costs to send is which factor when comparing topologies?", "Communication cost", others(FACTOR_NAMES, "Communication cost"), FACTORS, "Message cost and time is the communication cost.", "It is about the messages."),
  row("Whether the sites are still connected after a failure is which factor when comparing topologies?", "Reliability", others(FACTOR_NAMES, "Reliability"), FACTORS, "Staying connected after a failure is reliability.", "It is about what happens when something fails."),
  row("The basic cost of the cables and links is which factor when comparing topologies?", "Link cost", others(FACTOR_NAMES, "Link cost"), FACTORS, "The cost of the links is the link cost.", "It is about the cables."),
  row("How hard it is to add many sites is which factor when comparing topologies?", "Difficulty of connecting many sites", others(FACTOR_NAMES, "Difficulty of connecting many sites"), FACTORS, "That is the difficulty of connecting many sites.", "It is about size."),
]);

const all5 = (name: string) => others(TOPOLOGY_NAMES, name);
/** A second sketch question with five options, so "Hybrid" is always a live distractor and the answer changes from item to item (Pedagogy gate on #537). */
const mixed = mcq("tp.q.mixed", "Name the topology", "tp.topologies", "tp.obj.hybrid", [
  row("The figure shows a network. Which of the five topologies is it?", "Hybrid", all5("Hybrid"), TOPOLOGIES, "A hub joined by one cable to a closed loop mixes shapes: a hybrid.", "Is it one shape, or more than one?", { type: "topology", topology: "hybrid", caption: FIG }),
  row("The figure shows a network. Which of the five topologies is it?", "Star", all5("Star"), TOPOLOGIES, "One centre that every site joins, and nothing mixed in: a star.", "Is it one shape, or more than one?", { type: "topology", topology: "star", nodes: 8, caption: FIG }),
  row("The figure shows a network. Which of the five topologies is it?", "Bus", all5("Bus"), TOPOLOGIES, "One shared line with every site on it, and nothing mixed in: a bus.", "Is it one shape, or more than one?", { type: "topology", topology: "bus", nodes: 7, caption: FIG }),
  row("The figure shows a network. Which of the five topologies is it?", "Ring", all5("Ring"), TOPOLOGIES, "A single closed loop and nothing else: a ring.", "Is it one shape, or more than one?", { type: "topology", topology: "ring", nodes: 8, caption: FIG }),
]);

/* ---------- LAN, MAN, WAN; bridge and gateway; wireless ---------- */

const TYPES = "A LAN covers a building or campus, belongs to one organization and runs at 100 Mbps to over 40 Gbps (an office network). A MAN covers blocks to a city, up to about 100 km, with one operator and many users, usually a logical ring (city Wi-Fi, cable TV). A WAN covers a country or the world over common carriers' lines and is usually slower than a LAN (the Internet).";
const NET_TYPES = ["LAN", "MAN", "WAN"];
const types = mcq("nt.q.types", "LAN, MAN or WAN", "nt.types", "nt.obj.types", [
  row("A network covers a building or a campus and belongs to one organization. Which type is it?", "LAN", others(NET_TYPES, "LAN"), TYPES, "A building or campus network of one organization is a LAN.", "How large is the area?"),
  row("A network covers blocks up to a whole city, up to about 100 km, run by one operator for many users. Which type is it?", "MAN", others(NET_TYPES, "MAN"), TYPES, "A city-wide network is a MAN.", "It is between a building and a country."),
  row("A network covers a country or the world and uses the lines of common carriers. Which type is it?", "WAN", others(NET_TYPES, "WAN"), TYPES, "A country-wide or world-wide network over carriers' lines is a WAN.", "It is the largest."),
  row("Which type of network is the Internet?", "WAN", others(NET_TYPES, "WAN"), TYPES, "The Internet is a WAN.", "It covers the world."),
]);

const BG = "A bridge joins networks that use the same protocol. A gateway joins networks that use different protocols, translating between them.";
const bridgeGateway = mcq("nt.q.bridge-gateway", "Bridge or gateway", "nt.types", "nt.obj.bridge-gateway", [
  row("A device joins two LANs that use the same protocol. What is it?", "A bridge", ["A gateway"], BG, "Same protocol: a bridge.", "Does anything need translating?"),
  row("A device joins two networks that use different protocols and translates between them. What is it?", "A gateway", ["A bridge"], BG, "Different protocols, translating: a gateway.", "Does anything need translating?"),
  row("Which one has to translate between protocols?", "A gateway", ["A bridge"], BG, "A gateway translates.", "One of them joins networks that already agree."),
]);

const WIFI = "802.11a runs at 54 Mbps on 5 GHz with an indoor range of 25–75 ft. 802.11b runs at 11 Mbps on 2.4 GHz with 100–150 ft. 802.11g runs at 54 Mbps on 2.4 GHz with 100–150 ft. WiMax (802.16) is wireless broadband over up to about 10 miles.";
const STANDARDS = ["802.11a", "802.11b", "802.11g"];
const wireless = mcq("wl.q.standards", "Wireless standards", "wl.wlan", "wl.obj.standards", [
  row("Which wireless LAN standard runs at 11 Mbps?", "802.11b", others(STANDARDS, "802.11b"), WIFI, "11 Mbps is 802.11b.", "It is the slowest of the three."),
  row("Which wireless LAN standard works at 5 GHz?", "802.11a", others(STANDARDS, "802.11a"), WIFI, "5 GHz is 802.11a.", "The other two share another frequency."),
  row("Which wireless LAN standard runs at 54 Mbps on 2.4 GHz?", "802.11g", others(STANDARDS, "802.11g"), WIFI, "54 Mbps on 2.4 GHz is 802.11g.", "Two standards run at 54 Mbps; they differ in frequency."),
  row("Which wireless LAN standard has the shortest indoor range, 25 to 75 ft?", "802.11a", others(STANDARDS, "802.11a"), WIFI, "802.11a reaches 25–75 ft indoors.", "The other two reach 100–150 ft."),
]);

/* ---------- switching ---------- */

const SWITCHING = "Circuit switching sets up a dedicated path before sending (as the telephone does): real time, with a set-up delay first, for low-volume networks, with reduced line efficiency and easily overloaded, and preferred for voice. Packet switching is store and forward: the message is cut into equal packets and reassembled at the destination; in batches, for high-volume networks, with high line efficiency because the line is shared, flexible, reliable, with message priorities, and not good for voice.";
const SWITCH_NAMES = ["Circuit switching", "Packet switching"];
const switching = mcq("sw.q.switching", "Circuit or packet", "sw.switching", "sw.obj.switching", [
  row("A dedicated path is set up before anything is sent, as on the telephone. Which switching method is this?", "Circuit switching", others(SWITCH_NAMES, "Circuit switching"), SWITCHING, "A dedicated path set up first is circuit switching.", "Is the path set up before sending?"),
  row("The message is cut into equal packets, sent by store and forward, and reassembled at the destination. Which switching method is this?", "Packet switching", others(SWITCH_NAMES, "Packet switching"), SWITCHING, "Equal packets reassembled at the destination: packet switching.", "Is the message sent whole or in pieces?"),
  row("Which switching method is preferred for voice?", "Circuit switching", others(SWITCH_NAMES, "Circuit switching"), SWITCHING, "Voice needs a real-time path: circuit switching.", "Which one works in real time?"),
  row("Which switching method uses the line efficiently because the line is shared?", "Packet switching", others(SWITCH_NAMES, "Packet switching"), SWITCHING, "A shared line is used efficiently in packet switching.", "In which one is the line dedicated to one transmission?"),
]);

/* ---------- security and ethics ---------- */

const PROTECT = "Antivirus software prevents and diagnoses malware and is kept up to date. A firewall logs and controls access, hides the internal network, checks for viruses and authenticates. Encryption protects sensitive traffic. Password management means complex, memorable passwords that are changed often.";
const METHODS = ["Antivirus", "Firewall", "Encryption", "Password management"];
const protection = mcq("sc.q.protection", "Which protection", "sc.security", "sc.obj.protection", [
  row("Which protection detects and prevents malware and has to be kept up to date?", "Antivirus", others(METHODS, "Antivirus"), PROTECT, "Preventing and diagnosing malware is antivirus.", "Which one deals with viruses?"),
  row("Which protection filters and logs access and hides the internal network?", "Firewall", others(METHODS, "Firewall"), PROTECT, "Controlling and logging access and hiding the network is a firewall.", "It sits between the network and the outside."),
  row("Which protection scrambles sensitive traffic so that it cannot be read in transit?", "Encryption", others(METHODS, "Encryption"), PROTECT, "Protecting sensitive traffic is encryption.", "It changes the data itself."),
  row("Which protection means choosing complex, memorable passwords and changing them often?", "Password management", others(METHODS, "Password management"), PROTECT, "Complex, memorable, often changed: password management.", "It is about how people choose passwords."),
]);

const ETHICS = "The ethics section names the standards of IEEE and ACM, respect for privacy and proprietary information, and the issues of piracy, plagiarism, eavesdropping, cracking or hacking, and unauthorized access.";
const ethics = mcq("sc.q.ethics", "Ethics", "sc.security", "sc.obj.ethics", [
  row("Which of these is named as an ethical issue in networks?", "Piracy", ["Compaction", "Spooling"], ETHICS, "Piracy is one of the named issues.", "Which one is about behaviour, not about a technique?"),
  row("Which of these is named as an ethical issue in networks?", "Unauthorized access", ["Round Robin scheduling", "Paging"], ETHICS, "Unauthorized access is one of the named issues.", "Which one is about behaviour, not about a technique?"),
  row("Which of these is named as an ethical issue in networks?", "Eavesdropping", ["Blocking records", "Aging"], ETHICS, "Eavesdropping is one of the named issues.", "Which one is about behaviour, not about a technique?"),
  row("Which bodies' ethical standards does the chapter name?", "IEEE and ACM", ["ISO and ANSI", "IETF and W3C"], ETHICS, "The standards named are those of IEEE and ACM.", "Both are professional computing societies."),
]);

/* ---------- topics ---------- */

export const networkBasicsTopic: TopicInput = {
  id: "network-basics",
  title: "Network terms",
  summary: "Site, host and node; local and remote; client and server.",
  concepts: [{ id: "nw.terms", title: "Basic network terms", summary: "A site is a place, a host serves, a node is a name; local against remote; a client asks and waits." }],
  objectives: [
    { id: "nw.obj.terms", conceptId: "nw.terms", text: "Tell a site, a host and a node apart." },
    { id: "nw.obj.client-server", conceptId: "nw.terms", text: "Tell local from remote, and a client from a server host." },
  ],
  activities: [
    { id: "terms", title: "Site, host, node", summary: "Place, serving computer, identifying name.", authority: "DEMO", minutes: 5, questions: [terms] },
    { id: "client-server", title: "Local, remote, client, server", summary: "Whose resources, and who asks.", authority: "DEMO", minutes: 5, questions: [localRemote] },
  ],
};

export const topologiesTopic: TopicInput = {
  id: "topologies",
  title: "Topologies",
  summary: "Star, ring, bus, tree and hybrid: how each is drawn, what each costs and gains, and how topologies are compared.",
  concepts: [{ id: "tp.topologies", title: "Network topologies", summary: "Central controller, closed loop, one shared line, branching busses without loops, and mixes." }],
  objectives: [
    { id: "tp.obj.shape", conceptId: "tp.topologies", text: "Name the topology a sketch shows." },
    { id: "tp.obj.traits", conceptId: "tp.topologies", text: "Name the topology from its advantages and costs." },
    { id: "tp.obj.factors", conceptId: "tp.topologies", text: "Name the factor on which topologies are compared." },
    { id: "tp.obj.hybrid", conceptId: "tp.topologies", text: "Tell a hybrid (a mix) from the single shapes." },
  ],
  activities: [
    { id: "shape", title: "Which topology is drawn", summary: "Name the topology from the sketch.", authority: "DEMO", minutes: 9, questions: [shape, mixed] },
    { id: "traits", title: "Which topology", summary: "From how it behaves.", authority: "DEMO", minutes: 6, questions: [traits] },
    { id: "factors", title: "Comparing topologies", summary: "The four factors.", authority: "DEMO", minutes: 5, questions: [factors] },
  ],
};

export const networkTypesTopic: TopicInput = {
  id: "network-types",
  title: "LAN, MAN, WAN and wireless",
  summary: "Network types by area, owner and speed; bridges and gateways; the wireless LAN standards.",
  concepts: [
    { id: "nt.types", title: "LAN, MAN, WAN; bridge and gateway", summary: "Building, city, country; same protocol against different protocols." },
    { id: "wl.wlan", title: "Wireless LAN standards", summary: "802.11a, b and g: speed, frequency and range." },
  ],
  objectives: [
    { id: "nt.obj.types", conceptId: "nt.types", text: "Say whether a network is a LAN, a MAN or a WAN." },
    { id: "nt.obj.bridge-gateway", conceptId: "nt.types", text: "Tell a bridge from a gateway." },
    { id: "wl.obj.standards", conceptId: "wl.wlan", text: "Say which 802.11 standard has a given speed, frequency or range." },
  ],
  activities: [
    { id: "types", title: "LAN, MAN or WAN", summary: "By area and owner.", authority: "DEMO", minutes: 6, questions: [types] },
    { id: "bridge-gateway", title: "Bridge or gateway", summary: "Same protocol or different.", authority: "DEMO", minutes: 4, questions: [bridgeGateway] },
    { id: "wireless", title: "Wireless standards", summary: "802.11a, b and g.", authority: "DEMO", minutes: 5, questions: [wireless] },
  ],
};

export const switchingSecurityTopic: TopicInput = {
  id: "switching-security",
  title: "Switching, security and ethics",
  summary: "Circuit against packet switching; antivirus, firewall, encryption and password management; the ethics the chapter names.",
  concepts: [
    { id: "sw.switching", title: "Circuit and packet switching", summary: "A dedicated path set up first, against equal packets stored and forwarded." },
    { id: "sc.security", title: "Protection and ethics", summary: "Four protection methods and the named ethical issues." },
  ],
  objectives: [
    { id: "sw.obj.switching", conceptId: "sw.switching", text: "Say which switching method a description fits." },
    { id: "sc.obj.protection", conceptId: "sc.security", text: "Say which protection method a description fits." },
    { id: "sc.obj.ethics", conceptId: "sc.security", text: "Recognise the ethical issues and standards the chapter names." },
  ],
  activities: [
    { id: "switching", title: "Circuit or packet", summary: "Which switching method.", authority: "DEMO", minutes: 6, questions: [switching] },
    { id: "protection", title: "Which protection", summary: "Antivirus, firewall, encryption, passwords.", authority: "DEMO", minutes: 6, questions: [protection] },
    { id: "ethics", title: "Ethics", summary: "Issues and standards.", authority: "DEMO", minutes: 4, questions: [ethics] },
  ],
};
