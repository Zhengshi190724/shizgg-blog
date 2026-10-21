import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { motion } from 'motion/react';
import { ArrowLeft, Clock3, Hash, Link2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import rehypeRaw from 'rehype-raw';
import rehypeSanitize from 'rehype-sanitize';
import { usePosts } from '../hooks/usePosts.js';
import SEO from '../components/SEO/SEO.jsx';
import { siteConfig } from '../config/site.js';
import {
  getCategoryByName,
  getCategoryPath,
  getSubcategoryByName,
} from '../config/navigation.js';
import TableOfContents from '../components/TableOfContents/TableOfContents.jsx';
import ReadingProgress from '../components/ReadingProgress/ReadingProgress.jsx';
import ArticleNavigation from '../components/ArticleNavigation/ArticleNavigation.jsx';
import ResponsiveImage from '../components/ResponsiveImage/ResponsiveImage.jsx';
import MermaidDiagram from '../components/MermaidDiagram/MermaidDiagram.jsx';
import SeriesNavigation from '../components/SeriesNavigation/SeriesNavigation.jsx';
import PostShareActions from '../components/PostShareActions/PostShareActions.jsx';
import {
  markdownSanitizeSchema,
  markdownTextColorClass,
} from '../utils/markdownHtml.js';
import 'highlight.js/styles/github-dark.css';
import './PostPage.css';

function rehypeHeadingIds({ headings }) {
  return (tree) => {
    let headingIndex = 0;

    const visit = (node) => {
      if (node.type === 'element' && (node.tagName === 'h2' || node.tagName === 'h3')) {
        const heading = headings[headingIndex++];
        if (heading) {
          node.properties = { ...node.properties, id: heading.id };
        }
      }
      node.children?.forEach(visit);
    };

    visit(tree);
  };
}

function nodeText(node) {
  if (node?.type === 'text') return node.value || '';
  return node?.children?.map(nodeText).join('') || '';
}

export default function PostPage() {
  const { slug } = useParams();
  const { getPostBySlug, getAdjacentPosts, getRelatedPosts, getPostsBySeries, loadPostBySlug } = usePosts();
  const post = getPostBySlug(slug);
  const [content, setContent] = useState('');
  const [contentError, setContentError] = useState(false);

  useEffect(() => {
    let active = true;
    setContent('');
    setContentError(false);
    if (!post) return () => { active = false; };

    loadPostBySlug(post.slug)
      .then((loadedPost) => {
        if (active) setContent(loadedPost?.content || '');
      })
      .catch(() => {
        if (active) setContentError(true);
      });

    return () => {
      active = false;
    };
  }, [loadPostBySlug, post]);

  if (!post) {
    return (
      <div className="post-not-found">
        <SEO title={`文章不存在 | ${siteConfig.name}`} path={`/posts/${slug}/`} noindex />
        <span className="section-eyebrow">404 / Missing note</span>
        <h1>这篇文章不存在</h1>
        <p>它可能已被移动，或还没有完成。</p>
        <Link className="primary-action" to="/posts/"><ArrowLeft size={16} /> 返回文章</Link>
      </div>
    );
  }

  const { previous, next } = getAdjacentPosts(post.slug);
  const related = getRelatedPosts(post.slug);
  const category = getCategoryByName(post.category);
  const subcategory = getSubcategoryByName(category, post.subcategory);
  const seriesPosts = getPostsBySeries(post.series);

  const headingComponents = {
    p: ({ node, children, ...props }) => {
      const onlyImage = node?.children?.length === 1
        && node.children[0].type === 'element'
        && node.children[0].tagName === 'img';
      return onlyImage ? children : <p {...props}>{children}</p>;
    },
    img: ({ node, ...props }) => <ResponsiveImage {...props} />,
    font: ({ node, color, children }) => {
      const colorClass = markdownTextColorClass(color);
      return (
        <span className={`markdown-text-color${colorClass ? ` ${colorClass}` : ''}`}>
          {children}
        </span>
      );
    },
    pre: ({ node, children, ...props }) => {
      const codeNode = node?.children?.find((child) => (
        child.type === 'element' && child.tagName === 'code'
      ));
      const classNames = codeNode?.properties?.className || [];
      if (classNames.includes('language-mermaid')) {
        return <MermaidDiagram source={nodeText(codeNode).trim()} />;
      }
      return <pre {...props}>{children}</pre>;
    },
    h2: ({ node, children, ...props }) => {
      return (
        <h2 {...props}>
          {children}
          {props.id && <a className="heading-anchor" href={`#${props.id}`} aria-label="复制本节链接"><Link2 size={15} /></a>}
        </h2>
      );
    },
    h3: ({ node, children, ...props }) => {
      return (
        <h3 {...props}>
          {children}
          {props.id && <a className="heading-anchor" href={`#${props.id}`} aria-label="复制本节链接"><Link2 size={14} /></a>}
        </h3>
      );
    },
  };

  return (
    <motion.article
      className="post"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.55 }}
    >
      <ReadingProgress slug={post.slug} />
      <SEO
        title={`${post.title} | ${siteConfig.name}`}
        description={post.excerpt}
        path={`/posts/${post.slug}/`}
        type="article"
        image={post.cover || siteConfig.socialImage}
        imageAlt={post.cover ? post.title : siteConfig.socialImageAlt}
        publishedTime={post.date}
        modifiedTime={post.updated || post.date}
        schema={{
          '@context': 'https://schema.org',
          '@type': 'BlogPosting',
          headline: post.title,
          description: post.excerpt,
          datePublished: post.date,
          dateModified: post.updated || post.date,
          mainEntityOfPage: `${siteConfig.url}/posts/${post.slug}/`,
          author: { '@type': 'Person', name: siteConfig.author },
          publisher: { '@type': 'Person', name: siteConfig.author },
          keywords: post.tags.join(', '),
          image: new URL(post.cover || siteConfig.socialImage, siteConfig.url).toString(),
        }}
      />
      <Link to="/posts/" className="post-back"><ArrowLeft size={15} /> 返回文章列表</Link>

      <header className="post-header">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        >
          <span className="section-eyebrow">Field note / {post.date.slice(0, 4)}</span>
          <h1 className="post-title">{post.title}</h1>
          <p className="post-deck">{post.excerpt}</p>
        </motion.div>

        <div className="post-meta-row">
          {post.date && (
            <time className="post-date" dateTime={post.date}>
              {new Date(post.date).toLocaleDateString('zh-CN', {
                year: 'numeric', month: 'long', day: 'numeric',
              })}
            </time>
          )}
          <span className="post-reading-time"><Clock3 size={14} /> {post.readingTime} 分钟阅读</span>
          {category && <Link to={getCategoryPath(category)} className="post-tag">{category.name}</Link>}
          {subcategory && <Link to={getCategoryPath(category, subcategory)} className="post-tag">{subcategory.name}</Link>}
          <div className="post-tags">
            {post.tags.map((tag) => (
              <Link key={tag} to={`/tags/${tag}/`} className="post-tag"><Hash size={12} />{tag}</Link>
            ))}
          </div>
        </div>
        <PostShareActions title={post.title} path={`/posts/${post.slug}/`} />
      </header>

      <div className={`post-layout${post.headings.length === 0 ? ' post-layout--no-toc' : ''}`}>
        <TableOfContents headings={post.headings} />

        <div className="post-body">
          <TableOfContents headings={post.headings} mobile />
          <SeriesNavigation currentSlug={post.slug} name={post.series} posts={seriesPosts} />
          {contentError ? (
            <div className="post-content-state" role="alert">
              <strong>正文加载失败</strong>
              <span>请刷新页面后重试。</span>
            </div>
          ) : content ? (
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              rehypePlugins={[
                rehypeRaw,
                [rehypeHeadingIds, { headings: post.headings }],
                [rehypeSanitize, markdownSanitizeSchema],
                rehypeHighlight,
              ]}
              components={headingComponents}
            >
              {content}
            </ReactMarkdown>
          ) : (
            <div className="post-content-state" role="status">
              <span className="route-loading__indicator" />
              <span>正在加载正文</span>
            </div>
          )}

          <footer className="post-endnote">
            <span className="section-eyebrow">End of note</span>
            <p>感谢阅读。愿这篇记录能为你的下一次实践提供一点线索。</p>
          </footer>
          <ArticleNavigation previous={previous} next={next} related={related} />
        </div>
      </div>
    </motion.article>
  );
}
