import React, { useEffect, useRef, useState, useMemo } from 'react';
import * as d3 from 'd3';
import { 
  Network, Settings, Search, Info, ZoomIn, ZoomOut, Maximize2, 
  ChevronRight, Calendar, Target, Users, ExternalLink, Sliders, Play, Pause
} from 'lucide-react';
import { Contact, Event, Strategy } from '../types';

interface RelationshipVisualizerProps {
  contacts: Contact[];
  events: Event[];
  strategies: Strategy[];
  navigateToContact: (id: number) => void;
  navigateToEvent: (id: number) => void;
  navigateToStrategy: (id: number) => void;
}

interface VizNode extends d3.SimulationNodeDatum {
  id: string; // unique string: "c-1", "e-1", "s-1"
  type: 'contact' | 'event' | 'strategy';
  name: string;
  subtitle: string;
  avatar?: string;
  isHighPriority?: boolean;
  entityId: number;
}

interface VizLink extends d3.SimulationLinkDatum<VizNode> {
  id: string;
  source: string | VizNode;
  target: string | VizNode;
  type: 'event-link' | 'strategy-link' | 'knows-link';
  label: string;
}

export default function RelationshipVisualizer({
  contacts,
  events,
  strategies,
  navigateToContact,
  navigateToEvent,
  navigateToStrategy
}: RelationshipVisualizerProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Graph state & UI
  const [graphMode, setGraphMode] = useState<'direct' | 'unified'>('unified');
  const [selectedNode, setSelectedNode] = useState<VizNode | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showConfig, setShowConfig] = useState(false);
  const [isPlaying, setIsPlaying] = useState(true);

  // Physics settings state
  const [chargeStrength, setChargeStrength] = useState(-300);
  const [linkDistance, setLinkDistance] = useState(100);
  const [collisionRadius, setCollisionRadius] = useState(40);
  const [gravityStrength, setGravityStrength] = useState(0.1);

  // Helper: Name matching
  const namesMatch = (nameA: string, nameB: string) => {
    if (!nameA || !nameB) return false;
    const cleanA = nameA.toLowerCase().replace(/[^a-z0-9]/g, '');
    const cleanB = nameB.toLowerCase().replace(/[^a-z0-9]/g, '');
    return cleanA.includes(cleanB) || cleanB.includes(cleanA);
  };

  // 1. Build Nodes and Links Data
  const graphData = useMemo(() => {
    const nodes: VizNode[] = [];
    const links: VizLink[] = [];

    if (graphMode === 'unified') {
      // --- UNIFIED ENTITY MAP ---
      // Add Contacts as Nodes
      contacts.forEach(c => {
        nodes.push({
          id: `c-${c.id}`,
          type: 'contact',
          name: c.name,
          subtitle: c.title || 'Contact',
          avatar: c.avatar,
          entityId: c.id
        });
      });

      // Add Events as Nodes
      events.forEach(e => {
        nodes.push({
          id: `e-${e.id}`,
          type: 'event',
          name: e.name,
          subtitle: `${e.date} • ${e.location || 'No Location'}`,
          isHighPriority: e.isHighPriority,
          entityId: e.id
        });
      });

      // Add Strategies as Nodes
      strategies.forEach(s => {
        nodes.push({
          id: `s-${s.id}`,
          type: 'strategy',
          name: s.goal,
          subtitle: `Target: ${s.target}`,
          isHighPriority: s.isHighPriority,
          entityId: s.id
        });
      });

      // Connections: Contacts to Events
      contacts.forEach(c => {
        // Direct event link (eventId)
        if (c.eventId) {
          const matchingEvent = events.find(e => e.id === c.eventId);
          if (matchingEvent) {
            links.push({
              id: `l-c${c.id}-e${c.eventId}`,
              source: `c-${c.id}`,
              target: `e-${c.eventId}`,
              type: 'event-link',
              label: 'Attended/Linked'
            });
          }
        }

        // Implicit event link (specificPeople names)
        events.forEach(e => {
          if (e.specificPeople && e.specificPeople.some(pName => namesMatch(pName, c.name))) {
            const linkExists = links.some(l => l.source === `c-${c.id}` && l.target === `e-${e.id}`);
            if (!linkExists) {
              links.push({
                id: `l-c${c.id}-e${e.id}-impl`,
                source: `c-${c.id}`,
                target: `e-${e.id}`,
                type: 'event-link',
                label: 'Mentioned in event goals/audience'
              });
            }
          }
        });
      });

      // Connections: Contacts to Strategies
      contacts.forEach(c => {
        strategies.forEach(s => {
          // Check if contact is target
          const isTarget = namesMatch(s.target, c.name);
          // Check if contact is in chain
          const isInChain = s.chain && s.chain.some(link => 
            link.linkedContactId === c.id || namesMatch(link.person, c.name)
          );

          if (isTarget || isInChain) {
            links.push({
              id: `l-c${c.id}-s${s.id}`,
              source: `c-${c.id}`,
              target: `s-${s.id}`,
              type: 'strategy-link',
              label: isTarget ? 'Target of Strategy' : 'Pathway Connector'
            });
          }
        });
      });

      // Connections: Direct Contact knows Contact
      contacts.forEach(c => {
        if (c.whoTheyKnow) {
          c.whoTheyKnow.forEach(knownName => {
            const otherContact = contacts.find(oc => oc.id !== c.id && namesMatch(oc.name, knownName));
            if (otherContact) {
              // Avoid duplicate undirected links
              const linkId1 = `l-c${c.id}-c${otherContact.id}-knows`;
              const linkId2 = `l-c${otherContact.id}-c${c.id}-knows`;
              const exists = links.some(l => l.id === linkId1 || l.id === linkId2);
              if (!exists) {
                links.push({
                  id: linkId1,
                  source: `c-${c.id}`,
                  target: `c-${otherContact.id}`,
                  type: 'knows-link',
                  label: `${c.name} knows ${otherContact.name}`
                });
              }
            }
          });
        }
      });

    } else {
      // --- DIRECT CONTACT-TO-CONTACT MAP ---
      // Nodes are ONLY Contacts
      contacts.forEach(c => {
        nodes.push({
          id: `c-${c.id}`,
          type: 'contact',
          name: c.name,
          subtitle: c.title || 'Contact',
          avatar: c.avatar,
          entityId: c.id
        });
      });

      // Generate direct links based on shared context
      for (let i = 0; i < contacts.length; i++) {
        for (let j = i + 1; j < contacts.length; j++) {
          const c1 = contacts[i];
          const c2 = contacts[j];
          const sharedEvents: string[] = [];
          const sharedStrategies: string[] = [];
          let directKnows = false;

          // 1. Check shared events
          events.forEach(e => {
            const c1Attended = c1.eventId === e.id || (e.specificPeople && e.specificPeople.some(p => namesMatch(p, c1.name)));
            const c2Attended = c2.eventId === e.id || (e.specificPeople && e.specificPeople.some(p => namesMatch(p, c2.name)));
            if (c1Attended && c2Attended) {
              sharedEvents.push(e.name);
            }
          });

          // 2. Check shared strategies
          strategies.forEach(s => {
            const c1Involved = namesMatch(s.target, c1.name) || (s.chain && s.chain.some(l => l.linkedContactId === c1.id || namesMatch(l.person, c1.name)));
            const c2Involved = namesMatch(s.target, c2.name) || (s.chain && s.chain.some(l => l.linkedContactId === c2.id || namesMatch(l.person, c2.name)));
            if (c1Involved && c2Involved) {
              sharedStrategies.push(s.goal);
            }
          });

          // 3. Check direct knows relationship
          const c1KnowsC2 = c1.whoTheyKnow && c1.whoTheyKnow.some(p => namesMatch(p, c2.name));
          const c2KnowsC1 = c2.whoTheyKnow && c2.whoTheyKnow.some(p => namesMatch(p, c1.name));
          if (c1KnowsC2 || c2KnowsC1) {
            directKnows = true;
          }

          if (sharedEvents.length > 0 || sharedStrategies.length > 0 || directKnows) {
            const reasons: string[] = [];
            let type: 'event-link' | 'strategy-link' | 'knows-link' = 'knows-link';

            if (directKnows) {
              reasons.push('Direct acquaintance');
              type = 'knows-link';
            }
            if (sharedEvents.length > 0) {
              reasons.push(`Shared event: ${sharedEvents[0]}`);
              type = 'event-link';
            }
            if (sharedStrategies.length > 0) {
              reasons.push(`Shared strategy: ${sharedStrategies[0]}`);
              type = 'strategy-link';
            }

            links.push({
              id: `l-c${c1.id}-c${c2.id}-direct`,
              source: `c-${c1.id}`,
              target: `c-${c2.id}`,
              type,
              label: reasons.join(' | ')
            });
          }
        }
      }
    }

    return { nodes, links };
  }, [contacts, events, strategies, graphMode]);

  // Search filter list
  const filteredSearchList = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return [];
    return graphData.nodes.filter(n => n.name.toLowerCase().includes(q));
  }, [graphData, searchQuery]);

  // 2. D3 Simulation Implementation
  useEffect(() => {
    if (!svgRef.current) return;

    const svg = d3.select(svgRef.current);
    // Clear previous elements
    svg.selectAll('*').remove();

    const width = svgRef.current.clientWidth || 600;
    const height = svgRef.current.clientHeight || 550;

    // Define defs for shadows/glows and clipPaths for images
    const defs = svg.append('defs');

    // Filter for drop-shadow glow
    const glowFilter = defs.append('filter')
      .attr('id', 'glowing-node')
      .attr('x', '-30%')
      .attr('y', '-30%')
      .attr('width', '160%')
      .attr('height', '160%');

    glowFilter.append('feGaussianBlur')
      .attr('stdDeviation', '4')
      .attr('result', 'blur');

    glowFilter.append('feComposite')
      .attr('in', 'SourceGraphic')
      .attr('in2', 'blur')
      .attr('operator', 'over');

    // Create container group for zoom/pan
    const gContainer = svg.append('g').attr('class', 'zoom-container');

    // Setup zoom behavior
    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.15, 4])
      .on('zoom', (event) => {
        gContainer.attr('transform', event.transform);
      });

    svg.call(zoom);

    // Initial zoom position (centered)
    svg.call(zoom.transform, d3.zoomIdentity.translate(width / 2, height / 2).scale(0.85));

    // Deep copy of data for d3 mutation
    const nodes: VizNode[] = graphData.nodes.map(n => ({ ...n }));
    const links: VizLink[] = graphData.links.map(l => {
      // Find matching source and target nodes from the cloned node array
      const sId = typeof l.source === 'string' ? l.source : (l.source as VizNode).id;
      const tId = typeof l.target === 'string' ? l.target : (l.target as VizNode).id;
      return {
        ...l,
        source: nodes.find(n => n.id === sId) || sId,
        target: nodes.find(n => n.id === tId) || tId
      } as VizLink;
    });

    // Create Simulation
    const simulation = d3.forceSimulation<VizNode>(nodes)
      .force('link', d3.forceLink<VizNode, VizLink>(links)
        .id(d => d.id)
        .distance(linkDistance)
      )
      .force('charge', d3.forceManyBody().strength(chargeStrength))
      .force('collide', d3.forceCollide().radius(collisionRadius))
      .force('center', d3.forceCenter(0, 0).strength(0.08))
      .force('x', d3.forceX(0).strength(gravityStrength))
      .force('y', d3.forceY(0).strength(gravityStrength));

    if (!isPlaying) {
      simulation.stop();
    }

    // --- RENDER LINKS ---
    const linkElements = gContainer.append('g')
      .attr('class', 'links')
      .selectAll('line')
      .data(links)
      .enter()
      .append('line')
      .attr('id', d => d.id)
      .attr('stroke', d => {
        if (d.type === 'event-link') return '#10b981'; // green-500
        if (d.type === 'strategy-link') return '#007BFF'; // electric blue #007BFF
        return '#737373'; // zinc-500
      })
      .attr('stroke-opacity', 0.25)
      .attr('stroke-width', 2)
      .attr('stroke-dasharray', d => d.type === 'knows-link' ? '4 3' : 'none');

    // Add pointer events to links to show tooltip details
    linkElements
      .append('title')
      .text(d => d.label);

    // --- RENDER NODES ---
    const nodeElements = gContainer.append('g')
      .attr('class', 'nodes')
      .selectAll<SVGGElement, VizNode>('g')
      .data(nodes)
      .enter()
      .append('g')
      .attr('id', d => d.id)
      .attr('class', 'node-group cursor-pointer')
      .on('click', (event, d) => {
        setSelectedNode(d);
        highlightNeighbors(d);
        event.stopPropagation();
      })
      .call(d3.drag<SVGGElement, VizNode>()
        .on('start', dragstarted)
        .on('drag', dragged)
        .on('end', dragended)
      );

    // Node outer background/glow border
    nodeElements.append('circle')
      .attr('r', d => d.type === 'contact' ? 24 : 18)
      .attr('fill', d => {
        if (d.type === 'contact') return '#041D3D'; // deep sexy electric navy
        if (d.type === 'event') return '#064e3b'; // deep green
        return '#311042'; // deep purple/rose
      })
      .attr('stroke', d => {
        if (d.type === 'contact') return '#007BFF'; // electric blue #007BFF
        if (d.type === 'event') return '#10b981'; // emerald-500
        return '#ec4899'; // pink-500
      })
      .attr('stroke-width', d => d.isHighPriority ? 3 : 1.5)
      .attr('class', 'transition-all duration-200')
      .attr('filter', d => d.isHighPriority ? 'url(#glowing-node)' : 'none');

    // Node Icons/Avatars
    nodeElements.each(function(d) {
      const el = d3.select(this);
      if (d.type === 'contact' && d.avatar) {
        // Create unique clipPath for this contact node
        const clipId = `clip-${d.id}`;
        defs.append('clipPath')
          .attr('id', clipId)
          .append('circle')
          .attr('r', 22);

        el.append('image')
          .attr('href', d.avatar)
          .attr('x', -22)
          .attr('y', -22)
          .attr('width', 44)
          .attr('height', 44)
          .attr('clip-path', `url(#${clipId})`)
          .on('error', function() {
            // Fallback if image fails to load
            d3.select(this).remove();
            el.append('text')
              .attr('text-anchor', 'middle')
              .attr('dy', '.3em')
              .attr('fill', '#e5e5e5')
              .attr('font-size', '11px')
              .attr('font-weight', 'bold')
              .text(d.name.split(' ').map(n => n[0]).join('').slice(0, 2));
          });
      } else {
        // Plain SVG symbols
        let symbolText = '';
        let symbolColor = '#e5e5e5';
        let fontSize = '11px';

        if (d.type === 'contact') {
          symbolText = d.name.split(' ').map(n => n[0]).join('').slice(0, 2);
          fontSize = '11px';
        } else if (d.type === 'event') {
          symbolText = '📅';
          fontSize = '12px';
        } else {
          symbolText = '🎯';
          fontSize = '12px';
        }

        el.append('text')
          .attr('text-anchor', 'middle')
          .attr('dy', '.33em')
          .attr('fill', symbolColor)
          .attr('font-size', fontSize)
          .attr('font-weight', 'bold')
          .attr('pointer-events', 'none')
          .text(symbolText);
      }
    });

    // Node Labels
    nodeElements.append('text')
      .attr('text-anchor', 'middle')
      .attr('y', d => d.type === 'contact' ? 38 : 32)
      .attr('fill', '#e5e5e5')
      .attr('font-size', '10px')
      .attr('font-weight', '500')
      .attr('class', 'select-none pointer-events-none drop-shadow-[0_1.5px_2px_rgba(0,0,0,0.9)]')
      .text(d => d.name.length > 15 ? d.name.slice(0, 13) + '...' : d.name);

    // Node Subtitle Labels (Hidden by default, displayed on zoom/hover or high priority)
    nodeElements.append('text')
      .attr('text-anchor', 'middle')
      .attr('y', d => d.type === 'contact' ? 48 : 42)
      .attr('fill', '#a3a3a3')
      .attr('font-size', '8px')
      .attr('class', 'select-none pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-200')
      .text(d => d.subtitle.length > 20 ? d.subtitle.slice(0, 18) + '...' : d.subtitle);

    // Click outside nodes -> reset highlight
    svg.on('click', () => {
      setSelectedNode(null);
      nodeElements.select('circle')
        .attr('stroke-opacity', 1)
        .attr('fill-opacity', 1);
      nodeElements.select('text')
        .attr('fill-opacity', 1);
      nodeElements.select('image')
        .attr('opacity', 1);
      linkElements
        .attr('stroke-opacity', 0.25)
        .attr('stroke-width', 2);
    });

    // Highlight neighbors helper
    function highlightNeighbors(clickedNode: VizNode) {
      // Find all connected node IDs
      const connectedNodeIds = new Set<string>();
      connectedNodeIds.add(clickedNode.id);

      links.forEach(l => {
        const sourceId = typeof l.source === 'string' ? l.source : l.source.id;
        const targetId = typeof l.target === 'string' ? l.target : l.target.id;
        
        if (sourceId === clickedNode.id) {
          connectedNodeIds.add(targetId);
        } else if (targetId === clickedNode.id) {
          connectedNodeIds.add(sourceId);
        }
      });

      // Dim non-connected nodes
      nodeElements.select('circle')
        .attr('stroke-opacity', d => connectedNodeIds.has(d.id) ? 1.0 : 0.15)
        .attr('fill-opacity', d => connectedNodeIds.has(d.id) ? 1.0 : 0.2);

      nodeElements.select('image')
        .attr('opacity', d => connectedNodeIds.has(d.id) ? 1.0 : 0.15);

      nodeElements.select('text')
        .attr('fill-opacity', d => connectedNodeIds.has(d.id) ? 1.0 : 0.2);

      // Highlight active links
      linkElements
        .attr('stroke-opacity', l => {
          const sId = typeof l.source === 'string' ? l.source : l.source.id;
          const tId = typeof l.target === 'string' ? l.target : l.target.id;
          return (sId === clickedNode.id || tId === clickedNode.id) ? 0.9 : 0.05;
        })
        .attr('stroke-width', l => {
          const sId = typeof l.source === 'string' ? l.source : l.source.id;
          const tId = typeof l.target === 'string' ? l.target : l.target.id;
          return (sId === clickedNode.id || tId === clickedNode.id) ? 3.5 : 1;
        });
    }

    // --- ZOOM FUNCTIONS FOR EXTERNAL BUTTONS ---
    const zoomInBtn = d3.select('#viz-zoom-in');
    zoomInBtn.on('click', () => {
      svg.transition().duration(250).call(zoom.scaleBy, 1.3);
    });

    const zoomOutBtn = d3.select('#viz-zoom-out');
    zoomOutBtn.on('click', () => {
      svg.transition().duration(250).call(zoom.scaleBy, 0.7);
    });

    const zoomResetBtn = d3.select('#viz-zoom-reset');
    zoomResetBtn.on('click', () => {
      svg.transition().duration(350).call(
        zoom.transform,
        d3.zoomIdentity.translate(width / 2, height / 2).scale(0.85)
      );
    });

    // Tick update
    simulation.on('tick', () => {
      linkElements
        .attr('x1', d => (d.source as VizNode).x || 0)
        .attr('y1', d => (d.source as VizNode).y || 0)
        .attr('x2', d => (d.target as VizNode).x || 0)
        .attr('y2', d => (d.target as VizNode).y || 0);

      nodeElements
        .attr('transform', d => `translate(${d.x || 0},${d.y || 0})`);
    });

    // Drag helper functions
    function dragstarted(event: d3.D3DragEvent<SVGGElement, VizNode, unknown>, d: VizNode) {
      if (!event.active && isPlaying) simulation.alphaTarget(0.3).restart();
      d.fx = d.x;
      d.fy = d.y;
    }

    function dragged(event: d3.D3DragEvent<SVGGElement, VizNode, unknown>, d: VizNode) {
      d.fx = event.x;
      d.fy = event.y;
    }

    function dragended(event: d3.D3DragEvent<SVGGElement, VizNode, unknown>, d: VizNode) {
      if (!event.active && isPlaying) simulation.alphaTarget(0);
      d.fx = null;
      d.fy = null;
    }

    // Center on node function for search selection
    (window as any).centerOnNode = (nodeId: string) => {
      const match = nodes.find(n => n.id === nodeId);
      if (match) {
        setSelectedNode(match);
        highlightNeighbors(match);
        
        const transform = d3.zoomIdentity
          .translate(width / 2, height / 2)
          .scale(1.2)
          .translate(-(match.x || 0), -(match.y || 0));

        svg.transition()
          .duration(750)
          .call(zoom.transform, transform);
      }
    };

    return () => {
      simulation.stop();
    };
  }, [graphData, chargeStrength, linkDistance, collisionRadius, gravityStrength, isPlaying]);

  // Handler for searching node inside viewport
  const handleSelectSearchedNode = (nodeId: string) => {
    setSearchQuery('');
    // Call global handler bound inside useEffect
    if ((window as any).centerOnNode) {
      (window as any).centerOnNode(nodeId);
    }
  };

  return (
    <div ref={containerRef} className="flex flex-col h-full bg-zinc-950 text-zinc-100 rounded-3xl border border-zinc-900 overflow-hidden animate-fade-in">
      
      {/* Visualizer Top Bar */}
      <div className="bg-zinc-900/60 border-b border-zinc-900/80 px-4 py-3 flex flex-col sm:flex-row gap-3 items-center justify-between z-10 shrink-0">
        <div className="flex items-center gap-2">
          <Network className="w-5 h-5 text-indigo-400 animate-pulse" />
          <div>
            <h2 className="text-sm font-bold text-zinc-100 font-display">Relationship Engine Map</h2>
            <p className="text-[9px] font-mono text-zinc-500 uppercase tracking-widest">Shared Connections Network</p>
          </div>
        </div>

        {/* Search Inside Visualizer */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          {/* Graph Mode Buttons */}
          <div className="bg-zinc-950 border border-zinc-850 p-1 rounded-xl flex gap-1">
            <button
              id="viz-mode-unified-btn"
              data-tour-id="viz-mode-unified"
              type="button"
              onClick={() => setGraphMode('unified')}
              className={`px-3 py-1 text-[10px] font-bold rounded-lg transition-all cursor-pointer ${
                graphMode === 'unified' 
                  ? 'bg-indigo-600 text-white shadow-md' 
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              Unified Map
            </button>
            <button
              id="viz-mode-direct-btn"
              data-tour-id="viz-mode-direct"
              type="button"
              onClick={() => setGraphMode('direct')}
              className={`px-3 py-1 text-[10px] font-bold rounded-lg transition-all cursor-pointer ${
                graphMode === 'direct' 
                  ? 'bg-indigo-600 text-white shadow-md' 
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              Direct Contacts
            </button>
          </div>

          <div className="relative flex-1 sm:flex-initial">
            <Search className="w-3 h-3 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Locate node in graph..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-zinc-950 border border-zinc-850 rounded-xl pl-8 pr-3 py-1.5 text-[11px] focus:ring-1 focus:ring-indigo-500 outline-none w-full sm:w-44 transition-all"
            />
            {filteredSearchList.length > 0 && (
              <div className="absolute top-full right-0 left-0 sm:left-auto sm:w-56 mt-1 bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl max-h-40 overflow-y-auto z-20 p-1 no-scrollbar">
                {filteredSearchList.map(node => (
                  <button
                    key={node.id}
                    onClick={() => handleSelectSearchedNode(node.id)}
                    className="w-full text-left px-2.5 py-1.5 hover:bg-indigo-600/10 hover:text-indigo-300 rounded-lg text-[10px] text-zinc-300 font-medium border-b border-zinc-850/30 last:border-0 flex items-center gap-1.5 truncate"
                  >
                    <span>{node.type === 'contact' ? '👥' : node.type === 'event' ? '📅' : '🎯'}</span>
                    <span className="truncate">{node.name}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Toggle Config Menu */}
          <button
            id="viz-physics-toggle"
            data-tour-id="viz-physics-toggle"
            type="button"
            onClick={() => setShowConfig(!showConfig)}
            className={`p-1.5 rounded-xl border transition-all cursor-pointer ${
              showConfig 
                ? 'bg-indigo-600/10 border-indigo-500/40 text-indigo-400' 
                : 'bg-zinc-950 border-zinc-850 text-zinc-400 hover:text-white hover:border-zinc-800'
            }`}
            title="Physics Simulation Controls"
          >
            <Sliders className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Canvas + Sidebars Viewport */}
      <div className="flex-1 relative min-h-[480px] bg-zinc-950">
        
        {/* Floating Zoom / Flow Controls */}
        <div className="absolute bottom-4 left-4 z-10 flex flex-col gap-2">
          <div className="bg-zinc-900/90 border border-zinc-800 p-1 rounded-xl flex flex-col gap-1 shadow-xl">
            <button
              id="viz-zoom-in"
              className="p-2 hover:bg-zinc-800 text-zinc-300 hover:text-white rounded-lg transition-all cursor-pointer"
              title="Zoom In"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
            <button
              id="viz-zoom-out"
              className="p-2 hover:bg-zinc-800 text-zinc-300 hover:text-white rounded-lg transition-all cursor-pointer"
              title="Zoom Out"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <button
              id="viz-zoom-reset"
              className="p-2 hover:bg-zinc-800 text-zinc-300 hover:text-white rounded-lg transition-all cursor-pointer"
              title="Recenter Camera"
            >
              <Maximize2 className="w-4 h-4" />
            </button>
          </div>

          <button
            id="viz-simulation-play-pause"
            onClick={() => setIsPlaying(!isPlaying)}
            className={`p-2.5 rounded-xl border shadow-xl flex items-center justify-center transition-all cursor-pointer ${
              isPlaying 
                ? 'bg-indigo-600/20 border-indigo-500/20 text-indigo-400 hover:bg-indigo-600/30' 
                : 'bg-amber-600/20 border-amber-500/20 text-amber-400 hover:bg-amber-600/30'
            }`}
            title={isPlaying ? "Freeze Layout" : "Resume Live Physics"}
          >
            {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
          </button>
        </div>

        {/* Legend Overlay */}
        <div className="absolute top-4 left-4 z-10 pointer-events-none bg-zinc-900/85 border border-zinc-850/60 p-3 rounded-2xl text-[10px] space-y-1.5 shadow-xl max-w-xs font-sans">
          <p className="font-bold text-zinc-300 uppercase tracking-wider font-mono text-[9px] mb-1 text-indigo-400">Node Legend</p>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-indigo-950 border border-indigo-500 flex items-center justify-center text-[7px] font-bold">👤</span>
            <span className="text-zinc-300">Contacts / Directory Profiles</span>
          </div>
          {graphMode === 'unified' && (
            <>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-emerald-950 border border-emerald-500 flex items-center justify-center text-[7px] font-bold">📅</span>
                <span className="text-zinc-300">Shared Interaction Events</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-fuchsia-950 border border-pink-500 flex items-center justify-center text-[7px] font-bold">🎯</span>
                <span className="text-zinc-300">Target Strategy Milestones</span>
              </div>
            </>
          )}
          <div className="h-[1px] bg-zinc-800 my-1"></div>
          <p className="text-[9px] text-zinc-500 italic leading-relaxed">
            Drag profiles to adjust space. Click any profile to view interconnected relationships and map directories.
          </p>
        </div>

        {/* Collapsible Physics Controls Menu */}
        {showConfig && (
          <div className="absolute top-4 right-4 z-20 bg-zinc-900/95 border border-zinc-800 p-4 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] w-60 space-y-4 font-mono text-[10px]">
            <div className="flex justify-between items-center border-b border-zinc-800 pb-1.5">
              <span className="font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-1"><Settings className="w-3.5 h-3.5" /> Physics Config</span>
              <button onClick={() => setShowConfig(false)} className="text-zinc-500 hover:text-white transition-colors cursor-pointer">✕</button>
            </div>
            
            <div className="space-y-3 text-zinc-300">
              <div className="space-y-1">
                <div className="flex justify-between">
                  <span>Charge Pull</span>
                  <span className="text-indigo-400 font-bold">{chargeStrength}</span>
                </div>
                <input
                  type="range"
                  min="-600"
                  max="-50"
                  step="25"
                  value={chargeStrength}
                  onChange={(e) => setChargeStrength(Number(e.target.value))}
                  className="w-full h-1 bg-zinc-950 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                />
              </div>

              <div className="space-y-1">
                <div className="flex justify-between">
                  <span>Link Distance</span>
                  <span className="text-indigo-400 font-bold">{linkDistance}px</span>
                </div>
                <input
                  type="range"
                  min="40"
                  max="200"
                  step="10"
                  value={linkDistance}
                  onChange={(e) => setLinkDistance(Number(e.target.value))}
                  className="w-full h-1 bg-zinc-950 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                />
              </div>

              <div className="space-y-1">
                <div className="flex justify-between">
                  <span>Space Collision</span>
                  <span className="text-indigo-400 font-bold">{collisionRadius}px</span>
                </div>
                <input
                  type="range"
                  min="15"
                  max="80"
                  step="5"
                  value={collisionRadius}
                  onChange={(e) => setCollisionRadius(Number(e.target.value))}
                  className="w-full h-1 bg-zinc-950 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                />
              </div>

              <div className="space-y-1">
                <div className="flex justify-between">
                  <span>Gravity Pull</span>
                  <span className="text-indigo-400 font-bold">{gravityStrength.toFixed(2)}</span>
                </div>
                <input
                  type="range"
                  min="0.01"
                  max="0.40"
                  step="0.02"
                  value={gravityStrength}
                  onChange={(e) => setGravityStrength(Number(e.target.value))}
                  className="w-full h-1 bg-zinc-950 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                />
              </div>
            </div>

            <div className="pt-1.5 border-t border-zinc-800 text-[8px] text-zinc-500 italic text-center">
              Fine-tune the physics settings above if nodes clump up.
            </div>
          </div>
        )}

        {/* Selected Node Details Slide-over/Bottom Sheet on Mobile */}
        {selectedNode && (
          <div className="absolute inset-x-3 bottom-3 sm:inset-x-auto sm:top-4 sm:right-4 sm:bottom-4 z-20 w-auto sm:w-72 max-h-[55vh] sm:max-h-none bg-zinc-900/95 border border-zinc-800 rounded-2xl shadow-2xl flex flex-col p-4 animate-slide-in-up sm:animate-fade-in overflow-hidden backdrop-blur-md">
            <div className="flex justify-between items-center border-b border-zinc-800 pb-2 shrink-0">
              <span className="text-[10px] font-semibold text-indigo-400 uppercase tracking-wider font-mono flex items-center gap-1">
                <Info className="w-3.5 h-3.5" /> Selected Entity
              </span>
              <button 
                type="button"
                onClick={() => {
                  setSelectedNode(null);
                  if (svgRef.current) {
                    d3.select(svgRef.current).dispatch('click');
                  }
                }} 
                className="text-zinc-400 hover:text-white bg-zinc-950 hover:bg-zinc-800 p-1 rounded-lg transition-all cursor-pointer min-h-[32px] min-w-[32px] flex items-center justify-center"
              >
                ✕
              </button>
            </div>

            {/* Profile Detail Scrollable Area */}
            <div className="flex-1 overflow-y-auto no-scrollbar py-3 space-y-3">
              
              {/* Header Info */}
              <div className="flex flex-col items-center text-center">
                {selectedNode.type === 'contact' && selectedNode.avatar ? (
                  <img
                    src={selectedNode.avatar}
                    alt={selectedNode.name}
                    className="w-14 h-14 rounded-full border-2 border-indigo-500 shadow-md mb-2 object-cover"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold mb-2 shadow-md ${
                    selectedNode.type === 'contact' ? 'bg-indigo-600/20 text-indigo-400 border border-indigo-500/30' :
                    selectedNode.type === 'event' ? 'bg-emerald-600/20 text-emerald-400 border border-emerald-500/30' :
                    'bg-fuchsia-600/20 text-fuchsia-400 border border-pink-500/30'
                  }`}>
                    {selectedNode.type === 'contact' ? selectedNode.name.split(' ').map(n => n[0]).join('').slice(0, 2) : 
                     selectedNode.type === 'event' ? '📅' : '🎯'}
                  </div>
                )}
                <h3 className="font-semibold text-white text-sm font-display tracking-tight leading-snug px-2">{selectedNode.name}</h3>
                <p className="text-[10px] text-zinc-400 font-medium px-2 mt-0.5">{selectedNode.subtitle}</p>
                
                {selectedNode.isHighPriority && (
                  <span className="text-[8px] font-semibold font-mono text-amber-300 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full uppercase tracking-wider mt-1.5">
                    ★ High Priority
                  </span>
                )}
              </div>

              {/* Action Buttons */}
              <div className="pt-2 border-t border-zinc-800/80">
                <button
                  type="button"
                  id="viz-navigate-to-card"
                  onClick={() => {
                    if (selectedNode.type === 'contact') navigateToContact(selectedNode.entityId);
                    else if (selectedNode.type === 'event') navigateToEvent(selectedNode.entityId);
                    else if (selectedNode.type === 'strategy') navigateToStrategy(selectedNode.entityId);
                  }}
                  className="w-full min-h-[40px] bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-2 px-3 rounded-xl text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-md shadow-indigo-600/20 active:scale-95"
                >
                  {selectedNode.type === 'contact' && <><Users className="w-3.5 h-3.5" /> View Directory Profile</>}
                  {selectedNode.type === 'event' && <><Calendar className="w-3.5 h-3.5" /> View Event Details</>}
                  {selectedNode.type === 'strategy' && <><Target className="w-3.5 h-3.5" /> View Strategy Goals</>}
                  <ExternalLink className="w-3 h-3 shrink-0" />
                </button>
              </div>

              {/* Quick Info Field Details depending on node type */}
              <div className="space-y-2 text-[11px] pt-2 border-t border-zinc-800/80 leading-relaxed text-zinc-300">
                {selectedNode.type === 'contact' && (
                  <div className="bg-zinc-950 p-2.5 rounded-xl border border-zinc-850">
                    <p className="text-[9px] font-mono text-zinc-500 uppercase tracking-wider font-semibold mb-0.5">Relationship Role</p>
                    <p className="font-medium text-zinc-200">Contact Person</p>
                  </div>
                )}
                {selectedNode.type === 'event' && (
                  <div className="space-y-1.5">
                    <div className="bg-zinc-950 p-2 rounded-xl border border-zinc-850">
                      <p className="text-[9px] font-mono text-zinc-500 uppercase tracking-wider font-semibold mb-0.5">Interaction Date</p>
                      <p className="font-medium text-zinc-200">{selectedNode.subtitle.split('•')[0].trim() || 'No date set'}</p>
                    </div>
                    <div className="bg-zinc-950 p-2 rounded-xl border border-zinc-850">
                      <p className="text-[9px] font-mono text-zinc-500 uppercase tracking-wider font-semibold mb-0.5">Location Venue</p>
                      <p className="font-medium text-zinc-200">{selectedNode.subtitle.split('•')[1]?.trim() || 'Downtown Hub'}</p>
                    </div>
                  </div>
                )}
                {selectedNode.type === 'strategy' && (
                  <div className="bg-zinc-950 p-2.5 rounded-xl border border-zinc-850">
                    <p className="text-[9px] font-mono text-zinc-500 uppercase tracking-wider font-semibold mb-0.5">Target Persona</p>
                    <p className="font-medium text-zinc-200">{selectedNode.subtitle.replace('Target:', '').trim() || 'Specific Leader'}</p>
                  </div>
                )}
              </div>
            </div>

            <div className="text-[9px] text-zinc-500 text-center pt-2 border-t border-zinc-800/80 shrink-0">
              Tap the button above to manage connections or edit data cards.
            </div>
          </div>
        )}


        {/* Core Canvas Element */}
        <svg 
          ref={svgRef} 
          className="w-full h-full"
          style={{ minHeight: '480px' }}
        />
      </div>
    </div>
  );
}
