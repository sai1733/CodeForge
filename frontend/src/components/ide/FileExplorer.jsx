import React, { useState } from 'react';

// Helper to build hierarchical folder tree from flat files list
const buildFileTree = (files) => {
  const root = { name: 'root', type: 'folder', children: {}, path: '' };

  files.forEach((file) => {
    // Skip any helper files like .keep when building visual explorer if folder has other children
    const parts = file.path.split('/');
    let current = root;

    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      const isLast = i === parts.length - 1;

      if (isLast) {
        current.children[part] = {
          name: part,
          type: 'file',
          file: file,
          path: file.path
        };
      } else {
        const folderPath = parts.slice(0, i + 1).join('/');
        if (!current.children[part]) {
          current.children[part] = {
            name: part,
            type: 'folder',
            children: {},
            path: folderPath
          };
        }
        current = current.children[part];
      }
    }
  });

  return root;
};

// Recursive file tree node renderer
const FileNode = ({
  node,
  level,
  activeFileId,
  onFileSelect,
  onDeleteFile,
  expandedFolders,
  toggleFolder,
  selectedPath,
  setSelectedPath,
  creatingType,
  creatingParentPath,
  inputVal,
  setInputVal,
  onSubmitCreation,
  onCancelCreation,
  dragOverPath,
  onDragStart,
  onDragOver,
  onDragLeave,
  onDrop
}) => {
  const indent = level * 12; // 12px indent per folder depth

  if (node.type === 'file') {
    // Hide .keep folder-placeholder files from candidate view
    if (node.name === '.keep') return null;

    const file = node.file;
    const isActive = file._id === activeFileId;
    const isSelected = selectedPath === file.path;

    return (
      <div
        className="file-node"
        draggable
        onDragStart={(e) => onDragStart(e, file.path)}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0.35rem 0.5rem 0.35rem ' + (indent + 12) + 'px',
          backgroundColor: isActive ? 'var(--bg-accent)' : isSelected ? 'var(--bg-tertiary)' : 'transparent',
          color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
          cursor: 'pointer',
          fontSize: '0.825rem',
          transition: 'all var(--transition-fast)',
          borderLeft: isActive ? '3px solid var(--color-primary)' : '3px solid transparent'
        }}
        onClick={(e) => {
          e.stopPropagation();
          setSelectedPath(file.path);
          onFileSelect(file._id);
        }}
        onMouseEnter={(e) => {
          if (!isActive && !isSelected) e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)';
        }}
        onMouseLeave={(e) => {
          if (!isActive && !isSelected) e.currentTarget.style.backgroundColor = 'transparent';
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', overflow: 'hidden' }}>
          <span style={{ fontSize: '0.85rem' }}>
            {file.fileName.endsWith('.js') || file.fileName.endsWith('.jsx') ? '🟨' : file.fileName.endsWith('.html') ? '🟧' : file.fileName.endsWith('.css') ? '🟦' : '📄'}
          </span>
          <span style={{
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            fontWeight: isActive ? 600 : 400
          }} title={file.path}>
            {file.fileName}
          </span>
        </div>

        <button
          onClick={(e) => {
            e.stopPropagation();
            if (window.confirm(`Delete "${file.path}" from workspace?`)) {
              onDeleteFile(file._id);
            }
          }}
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--text-muted)',
            cursor: 'pointer',
            fontSize: '0.8rem',
            padding: '2px 4px',
            borderRadius: '4px'
          }}
          onMouseEnter={(e) => e.target.style.color = 'var(--color-danger)'}
          onMouseLeave={(e) => e.target.style.color = 'var(--text-muted)'}
          title="Delete File"
        >
          🗑️
        </button>
      </div>
    );
  }

  // Folder Node
  const isExpanded = expandedFolders[node.path] !== false; // Defaults to true (expanded)
  const isSelected = selectedPath === node.path;
  const isDragOver = dragOverPath === node.path;

  // Sort folder children: folders first, then files, both alphabetically
  const childrenKeys = Object.keys(node.children).sort((a, b) => {
    const nodeA = node.children[a];
    const nodeB = node.children[b];
    if (nodeA.type !== nodeB.type) {
      return nodeA.type === 'folder' ? -1 : 1;
    }
    return a.localeCompare(b);
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      <div
        className="folder-node"
        draggable
        onDragStart={(e) => onDragStart(e, node.path)}
        onDragOver={(e) => onDragOver(e, node.path)}
        onDragLeave={(e) => onDragLeave(e, node.path)}
        onDrop={(e) => onDrop(e, node.path)}
        style={{
          display: 'flex',
          alignItems: 'center',
          padding: '0.35rem 0.5rem 0.35rem ' + (indent + 12) + 'px',
          color: 'var(--text-primary)',
          cursor: 'pointer',
          fontSize: '0.825rem',
          fontWeight: isSelected ? 600 : 500,
          gap: '0.4rem',
          userSelect: 'none',
          backgroundColor: isDragOver ? 'rgba(79, 70, 229, 0.15)' : isSelected ? 'var(--bg-tertiary)' : 'transparent',
          border: isDragOver ? '1.5px dashed var(--color-primary)' : '1.5px solid transparent',
          borderRadius: '4px'
        }}
        onClick={(e) => {
          e.stopPropagation();
          setSelectedPath(node.path);
          toggleFolder(node.path);
        }}
        onMouseEnter={(e) => {
          if (!isSelected && !isDragOver) e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)';
        }}
        onMouseLeave={(e) => {
          if (!isSelected && !isDragOver) e.currentTarget.style.backgroundColor = 'transparent';
        }}
      >
        <span style={{ 
          fontSize: '0.55rem', 
          transform: isExpanded ? 'rotate(90deg)' : 'none', 
          display: 'inline-block', 
          transition: 'transform 0.1s ease', 
          color: 'var(--text-muted)',
          width: '8px'
        }}>
          ▶
        </span>
        <span style={{ fontSize: '0.95rem' }}>
          {isExpanded ? '📂' : '📁'}
        </span>
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {node.name}
        </span>
      </div>

      {isExpanded && (
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {/* Inline creation input nested directly in the active folder */}
          {creatingType && creatingParentPath === node.path && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              padding: '0.25rem 0.5rem 0.25rem ' + (indent + 24) + 'px'
            }}>
              <span style={{ fontSize: '0.85rem' }}>{creatingType === 'folder' ? '📁' : '📄'}</span>
              <input
                autoFocus
                type="text"
                placeholder={creatingType === 'folder' ? 'Folder name...' : 'File name...'}
                value={inputVal}
                onChange={(e) => setInputVal(e.target.value)}
                onBlur={onCancelCreation}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') onSubmitCreation();
                  else if (e.key === 'Escape') onCancelCreation();
                }}
                style={{
                  fontSize: '0.75rem',
                  padding: '2px 6px',
                  backgroundColor: 'var(--bg-secondary)',
                  border: '1px solid var(--color-primary)',
                  color: 'var(--text-primary)',
                  outline: 'none',
                  borderRadius: '3px',
                  flexGrow: 1
                }}
              />
            </div>
          )}

          {childrenKeys.map((key) => (
            <FileNode
              key={node.children[key].path}
              node={node.children[key]}
              level={level + 1}
              activeFileId={activeFileId}
              onFileSelect={onFileSelect}
              onDeleteFile={onDeleteFile}
              expandedFolders={expandedFolders}
              toggleFolder={toggleFolder}
              selectedPath={selectedPath}
              setSelectedPath={setSelectedPath}
              creatingType={creatingType}
              creatingParentPath={creatingParentPath}
              inputVal={inputVal}
              setInputVal={setInputVal}
              onSubmitCreation={onSubmitCreation}
              onCancelCreation={onCancelCreation}
              dragOverPath={dragOverPath}
              onDragStart={onDragStart}
              onDragOver={onDragOver}
              onDragLeave={onDragLeave}
              onDrop={onDrop}
            />
          ))}
        </div>
      )}
    </div>
  );
};

const FileExplorer = ({ files, activeFileId, onFileSelect, onCreateFile, onDeleteFile, activeProjectId, onRefresh, onMovePath }) => {
  const [creatingType, setCreatingType] = useState(null); // 'file' | 'folder' | null
  const [creatingParentPath, setCreatingParentPath] = useState('');
  const [selectedPath, setSelectedPath] = useState('');
  const [inputVal, setInputVal] = useState('');
  const [expandedFolders, setExpandedFolders] = useState({});
  const [dragOverPath, setDragOverPath] = useState(null);

  const toggleFolder = (path) => {
    setExpandedFolders((prev) => ({
      ...prev,
      [path]: prev[path] === false ? true : false
    }));
  };

  const handleStartCreation = (type) => {
    if (!activeProjectId) return;
    setCreatingType(type);
    setInputVal('');

    // Determine parent path based on selected path
    if (!selectedPath) {
      setCreatingParentPath(''); // Root
    } else {
      // If selectedPath belongs to a file, get its folder parent. If it is a folder, use it directly.
      const isFolder = files.some(f => f.path.startsWith(selectedPath + '/'));
      if (isFolder) {
        setCreatingParentPath(selectedPath);
        // Force expand target folder so input is visible
        setExpandedFolders(prev => ({ ...prev, [selectedPath]: true }));
      } else {
        const parts = selectedPath.split('/');
        if (parts.length > 1) {
          const parent = parts.slice(0, -1).join('/');
          setCreatingParentPath(parent);
        } else {
          setCreatingParentPath('');
        }
      }
    }
  };

  const handleCancelCreation = () => {
    setCreatingType(null);
    setInputVal('');
  };

  const handleSubmitCreation = async () => {
    const name = inputVal.trim();
    if (!name) {
      handleCancelCreation();
      return;
    }

    const parent = creatingParentPath;
    const finalPath = parent ? `${parent}/${name}` : name;

    try {
      if (creatingType === 'folder') {
        // Folders are persisted with a '.keep' file in flat DB model
        await onCreateFile({
          fileName: '.keep',
          path: `${finalPath}/.keep`,
          content: '# Keep Folder',
          projectId: activeProjectId
        });
      } else {
        // Files
        await onCreateFile({
          fileName: name,
          path: finalPath,
          content: '',
          projectId: activeProjectId
        });
      }
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || 'Failed to create item.');
    } finally {
      handleCancelCreation();
    }
  };

  // Drag and Drop Handlers
  const handleDragStart = (e, path) => {
    e.dataTransfer.setData('text/plain', path);
  };

  const handleDragOver = (e, path) => {
    e.preventDefault();
    if (dragOverPath !== path) {
      setDragOverPath(path);
    }
  };

  const handleDragLeave = (e, path) => {
    if (dragOverPath === path) {
      setDragOverPath(null);
    }
  };

  const handleDrop = async (e, targetPath) => {
    e.preventDefault();
    setDragOverPath(null);

    const sourcePath = e.dataTransfer.getData('text/plain');
    if (!sourcePath || sourcePath === targetPath) return;
    
    // Mute dropping folder inside itself
    if (targetPath && targetPath.startsWith(sourcePath + '/')) {
      return;
    }

    const name = sourcePath.split('/').pop();
    const newPath = targetPath ? `${targetPath}/${name}` : name;

    if (window.confirm(`Move "${name}" to ${targetPath ? `"${targetPath}"` : 'workspace root'}?`)) {
      if (onMovePath) {
        onMovePath(sourcePath, newPath);
      }
    }
  };

  // Build root nodes
  const root = buildFileTree(files);
  const rootKeys = Object.keys(root.children).sort((a, b) => {
    const nodeA = root.children[a];
    const nodeB = root.children[b];
    if (nodeA.type !== nodeB.type) {
      return nodeA.type === 'folder' ? -1 : 1;
    }
    return a.localeCompare(b);
  });

  return (
    <div 
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: 'var(--bg-secondary)', 
        color: 'var(--text-primary)',
        borderRight: '1px solid var(--border-light)',
        userSelect: 'none'
      }}
      onClick={() => setSelectedPath('')} // Clicking empty space resets focus selection to root
      onDragOver={(e) => handleDragOver(e, '')}
      onDrop={(e) => handleDrop(e, '')}
    >
      {/* Sidebar Explorer Title Header */}
      <div style={{
        padding: '0.6rem 1rem',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderBottom: '1px solid var(--border-light)'
      }}>
        <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
          Workspace Explorer
        </span>
        
        {activeProjectId && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <button
              onClick={(e) => { e.stopPropagation(); handleStartCreation('file'); }}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--text-secondary)',
                cursor: 'pointer',
                fontSize: '0.95rem',
                padding: '2px',
                borderRadius: '3px'
              }}
              title="New File"
            >
              📄⁺
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); handleStartCreation('folder'); }}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--text-secondary)',
                cursor: 'pointer',
                fontSize: '0.95rem',
                padding: '2px',
                borderRadius: '3px'
              }}
              title="New Folder"
            >
              📁⁺
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); onRefresh(); }}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--text-secondary)',
                cursor: 'pointer',
                fontSize: '0.9rem',
                padding: '2px',
                borderRadius: '3px'
              }}
              title="Refresh Workspace"
            >
              🔄
            </button>
          </div>
        )}
      </div>

      {/* Root-Level Creation Input Box (if no parent folder is selected) */}
      {creatingType && creatingParentPath === '' && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.4rem',
          padding: '0.4rem 1rem'
        }}>
          <span style={{ fontSize: '0.9rem' }}>{creatingType === 'folder' ? '📁' : '📄'}</span>
          <input
            autoFocus
            type="text"
            placeholder={creatingType === 'folder' ? 'Folder name...' : 'File name...'}
            value={inputVal}
            onChange={(e) => setInputVal(e.target.value)}
            onBlur={handleCancelCreation}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSubmitCreation();
              else if (e.key === 'Escape') handleCancelCreation();
            }}
            style={{
              fontSize: '0.75rem',
              padding: '4px 8px',
              backgroundColor: 'var(--bg-primary)',
              border: '1px solid var(--color-primary)',
              color: 'var(--text-primary)',
              outline: 'none',
              borderRadius: '4px',
              flexGrow: 1
            }}
          />
        </div>
      )}

      {/* Files List Tree Loop */}
      <div style={{
        flexGrow: 1,
        overflowY: 'auto',
        padding: '0.5rem 0.25rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '1px'
      }}>
        {!activeProjectId ? (
          <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', textAlign: 'center', padding: '2rem 1rem' }}>
            Select a project workspace.
          </p>
        ) : files.length === 0 ? (
          <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', textAlign: 'center', padding: '2rem 1rem' }}>
            Empty workspace.
          </p>
        ) : (
          rootKeys.map((key) => (
            <FileNode
              key={root.children[key].path}
              node={root.children[key]}
              level={0}
              activeFileId={activeFileId}
              onFileSelect={onFileSelect}
              onDeleteFile={onDeleteFile}
              expandedFolders={expandedFolders}
              toggleFolder={toggleFolder}
              selectedPath={selectedPath}
              setSelectedPath={setSelectedPath}
              creatingType={creatingType}
              creatingParentPath={creatingParentPath}
              inputVal={inputVal}
              setInputVal={setInputVal}
              onSubmitCreation={handleSubmitCreation}
              onCancelCreation={handleCancelCreation}
              dragOverPath={dragOverPath}
              onDragStart={handleDragStart}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            />
          ))
        )}
      </div>
    </div>
  );
};

export default FileExplorer;
